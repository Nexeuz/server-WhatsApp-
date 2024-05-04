const express = require("express");
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const cors = require('cors');
const bodyParser = require('body-parser');
const { LocalStorage } = require('node-localstorage');

const puppeteer = require('puppeteer');
const fs = require('fs');
const { JSDOM } = require('jsdom');
const path = require('path');
const adminFirebase = require('firebase-admin');
const qrcode = require('qrcode-terminal');
const localStorage = new LocalStorage('./localstorage');


// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional

adminFirebase.initializeApp(
  {
    credential: adminFirebase.credential.cert(require('./picolidb-firebase-adminsdk.json'))
  }
);

const db = adminFirebase.firestore();

// Create an Express server
const app = express();
const port = 3001;
app.use(cors())
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));


// customer data

const KEY_CUSTOMER = 'customer';

let customer = {
  email: '',
  name: '',
  phone: '',
  points: 0,
  dni: ''
}

const countryCodeCO = "57"
const whatsappId = "@c.us"


const sessionId = "YOUR_CLIENT_2";

// Start the server

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});


/** 
*/




const allSessionsObject = {};
class MyLocalAuth extends LocalAuth {
  constructor(opts) {
    super(opts)
  }
  async afterBrowserInitialized() {
    super.afterBrowserInitialized()
    this.client.pupBrowser.on('disconnected', () => this.client.emit('pup_disconnected'))
  }
}

// Create a new instance of the Client class
const client = new Client({
  puppeteer: {
    headless: true
  },
  authStrategy: new MyLocalAuth({
    clientId: sessionId,

  }),
  webVersionCache: {
    type: 'remote',
    remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html'
  },
  args: ['--no-sandbox',
    'disable-setuid-sandbox',
    '--unhandled-rejections=strict'],
  ignoreDefaultArgs: ['--disable-dev-shm-usage'],
  ignoreHTTPSErrors: true

});
// Listen for the 'qr' event to get the QR code for authentication
client.on('qr', (qr) => {
  console.log('Scan the QR code to authenticate:', qr);
  qrcode.generate(qr, { small: true })
});


client.on('ready', async () => {
  console.log('Client is ready to send messages');

  const customerLocal = localStorage.getItem(KEY_CUSTOMER);

  if (customerLocal) {
    console.log('Sending again skipped message to: ', customerLocal);
    customer = JSON.parse(customerLocal)
    await sendMessage();
    await sendPDFtoNumber();
    localStorage.clear();

  }

});

client.on('auth_failure', () => {
  console.log('auth_failure');
  const authSessionDirectory = path.join(__dirname, '.wwebjs_auth');

  // Asynchronously delete the file
  fs.rm(authSessionDirectory, { recursive: true, force: true }, (err) => {
    if (err) {
      // An error occurred
      console.error('Failed to delete the directory:', err);
    } else {
      // No error occurred, directory deleted successfully
      console.log('Directory deleted successfully');
      localStorage.clear();
    }
  });
});

client.on('pup_disconnected', () => {
  process.exit();
});

app.post('/send-message', (req, res) => {
  console.log('/send-message request');
  const request = req.body.data
  console.log(request);


  function findData(obj, param) {
    for (let key in obj) {
      if (obj.hasOwnProperty(key) && typeof obj[key] === 'object' && param in obj[key]) {
        return obj[key][param];
      }
    }
    return null; // Return null if no email property is found
  }

  const email = findData(request, 'email');
  const nombre = findData(request, 'nombre');
  const date = findData(request, 'date');
  const customerData = findData(request, 'customer');
  const puntos = findData(request, 'puntos');


  customer = {
    email: email,
    name: nombre,
    dni: customerData ? customerData.dni : null,
    phone: customerData ? customerData.phone ? `${customerData.phone.slice(0, 10).trim()}` : null : null,
    points: puntos
  }
  console.log(customer);  
  localStorage.setItem(KEY_CUSTOMER, JSON.stringify(customer));
  // Send a response
  res.status(200).json({ message: 'Request body processed' });
});


app.post('/generate-pdf', async (req, res) => {
  debugger
  console.log('/generate-pdf request');

  const html = req.body.html;
  if (!html) {
    return res.status(400).send('No HTML content provided');
  }

  const dom = new JSDOM(html);

  const document = dom.window.document;

  const elementsToCenter = document.querySelectorAll('.center'); // Select elements with class 'center'
  elementsToCenter.forEach(element => {
    element.style.textAlign = 'center'; // Center-align the text
  });

  const updatedHtml = dom.serialize();
  const browser = await puppeteer.launch();


  try {
    // Create a new page
    const page = await browser.newPage();

    await page.setContent(updatedHtml, { waitUntil: 'networkidle0', timeout: 60000 });


    await page.emulateMediaType('screen');

    const documentHeight = await page.evaluate(() => {
      // Return the total height of the document, including scrollable area
      return document.body.scrollHeight;
    });

    console.log(documentHeight);

    let dynamicPdfFileName = 'output.pdf'; // Replace with actual dynamic file name
  

    await page.pdf({
      path: dynamicPdfFileName,
      margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' },
        width: '450px',
      height: `${documentHeight * 1.2}px`,
      printBackground: true
      
    })
    await sendMessage();
    await sendPDFtoNumber();
    res.status(200).json({ message: 'PDF sent to number '+  customer.phone });

    console.log('messages succesfuly sent to: ', customer.phone)

  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Error sending PDF to number '+  customer.phone });
    process.exit()
  } finally {
    localStorage.clear();
    browser.close();
  }

});

async function updateExistingClient(docId, newData) {
  try {
    await db.collection('clients').doc(docId).update(newData);
    console.log('Client data updated successfully.');
  } catch (error) {
    console.error('Error updating client:', error);
  }
}

async function createNewClient(phoneNumber, name, cedula, currentPoints, email) {
  try {
    await db.collection('clients').add({
      phone: phoneNumber,
      name: name,
      currentPoints: currentPoints,
      cedula: cedula,
      email: email
    });
    console.log('New client created successfully.');
  } catch (error) {
    console.error('Error creating client:', error);
  }
}


async function sendMessage() {
  if (customer ? customer.phone : false) {
    const phoneNumber = customer.phone;
    const cedula = customer.dni;

    const clientRef = db.collection('clients').where('cedula', '==', cedula);


    try {
      // Retrieve the document for sentMessages
      const querySnapshot = await clientRef.get();


      if (querySnapshot.empty) {

        await createNewClient(phoneNumber, customer.name, customer.dni, customer.points, customer.email);


        sendWhatsAppMessage(`¡Hola, *${capitalizeFirstLetter(customer.name)}*! 🎉 Gracias por unirte a nuestra comunidad. Para empezar con buen pie, te invitamos a seguirnos y disfrutar de un mundo lleno de novedades, concursos y promociones exclusivas:\n\n *-Facebook* toca aquí: https://www.facebook.com/piccoliangelitos\n\n *-Instagram* toca aqui: https://www.instagram.com/piccoli_angelitos/\n\n*Beneficio Extra*: ¡Síguenos y obtén un 5% de descuento en tu próxima compra!\n\n*🌟Puntos de Fidelidad*: Estás a solo *${1000 - Number(customer.points)}* puntos de ganar un bono de *$30.000*. ¡Sigue sumando!\n\n👥 *Únete a nuestro Grupo VIP*: Accede a novedades, promociones y descuentos antes que nadie. Toca aquí: https://chat.whatsapp.com/LMZPjAEt8dtDs7ukoMWox4\n\n¡Estamos emocionados por lo que viene!\n\n Gracias por confiar en nosotros.\nCon cariño,\nEl Equipo de Piccoli Angelitos 💖`, `${countryCodeCO}${customer.phone}${whatsappId}`)
        sendWhatsAppMessage('_Recuerda añadirnos a tus contactos para recibir nuestras novedades y promociones especiales._', `${countryCodeCO}${customer.phone}${whatsappId}`)
       

      } else {
        querySnapshot.forEach(async (doc) => {
          console.log('Document data:', doc.data());
          const docId = doc.id;
          // Update the existing document with new data
          const newData = { phone: phoneNumber, name: customer.name, cedula: customer.dni, currentPoints: customer.points, email: customer.email };
          await updateExistingClient(docId, newData);
        });
        sendWhatsAppMessage(`¡Hola, ${capitalizeFirstLetter(customer.name)}!🎉\n\n¡Gracias por elegirnos una vez más y por ser parte de nuestra comunidad! Te animamos a seguirnos para mantenerte al tanto de todas nuestras novedades, concursos y promociones exclusivas:\n\n *-Facebook* toca aquí: https://www.facebook.com/piccoliangelitos\n\n *-Instagram* toca aqui: https://www.instagram.com/piccoli_angelitos/\n\n*Beneficio Extra*: ¡Síguenos y obtén un 5% de descuento en tu próxima compra!\n\n*🌟Puntos de Fidelidad*: Estás a solo *${1000 - Number(customer.points)}* puntos de ganar un bono de *$30.000*. ¡Sigue sumando!\n\n👥 *Únete a nuestro Grupo VIP*: Accede a novedades, promociones y descuentos antes que nadie. Toca aquí: https://chat.whatsapp.com/LMZPjAEt8dtDs7ukoMWox4\n\n¡Estamos emocionados por lo que viene!\n\n Gracias por confiar en nosotros.\nCon cariño,\nEl Equipo de Piccoli Angelitos 💖`, `${countryCodeCO}${customer.phone}${whatsappId}`)
        sendWhatsAppMessage('_Recuerda añadirnos a tus contactos para recibir nuestras novedades y promociones especiales._', `${countryCodeCO}${customer.phone}${whatsappId}`)

      }
    } catch (error) {
      console.error('Error interacting with Firestore or sending message:', error);
      process.exit();
    }
  }
}



async function sendWhatsAppMessage(message, phone) {
  return client.sendMessage(phone, message)
}


async function sendPDFtoNumber() {
  if (customer ? customer.phone : false) {

    const phoneNumber = `${countryCodeCO}${customer.phone}${whatsappId}`;
  

  

    // Construct the full path to the PDF file
    let pdfFilePath = path.join(__dirname, 'output.pdf');

    // Read the PDF file
    const pdfFile = fs.readFileSync(pdfFilePath);

    // Create a MessageMedia object from the PDF
    const media = new MessageMedia('application/pdf', pdfFile.toString('base64'), 'ticket de compra');

    // Send the PDF to the  phone number
    return client.sendMessage(phoneNumber, media);

  }
}

function capitalizeFirstLetter(sentence) {
  // Split the sentence into words
  let words = sentence.split(' ');

  // Iterate through each word
  for (let i = 0; i < words.length; i++) {
    // Capitalize the first letter of each word
    words[i] = words[i].charAt(0).toUpperCase() + words[i].slice(1);
  }

  // Join the words back into a sentence
  let capitalizedSentence = words.join(' ');

  return capitalizedSentence;
}




client.initialize().catch(_ => _)



