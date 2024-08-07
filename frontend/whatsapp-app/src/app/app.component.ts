import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { QrCodeModule } from 'ng-qrcode';
import { WebSocketService } from './services/web-socket.service';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, QrCodeModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'whatsapp-app';

  qrCode: string | undefined = undefined;
  status: string | undefined = undefined;



  constructor(private socketService: WebSocketService) {
      this.socketService.connect()
  }


  sendMessage(message: string): void {
  }
  getMessages() {

  }

  ngOnInit(): void {

    this.socketService.getQr().subscribe(hello => {
      console.log(hello);
    })



 
  

  }
}
