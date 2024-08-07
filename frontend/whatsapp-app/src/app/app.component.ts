import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { QrCodeModule } from 'ng-qrcode';
import { WebSocketService } from './services/web-socket.service';
import { Socket } from 'socket.io-client';
import { BehaviorSubject, Observable, Subject } from 'rxjs';

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

  messages: string[] = [];

  private errorSubject: Subject<string>;
  errors$: Observable<string> | undefined;

  private connectionSubject: Subject<boolean>;




  constructor(private socketService: WebSocketService) {

    this.errorSubject = new Subject();

    this.connectionSubject = new Subject<boolean>
    


      // in this component you define what to do
      // with received event of type 'message'
      this.socketService.socket.on('message', (data: any) => {
        this.messages.push(data);
        console.log(this.messages)
      });

        // in this component you define what to do
    // with received event of type 'message'
    this.socketService.socket.on('message', (data: any) => {
      this.messages.push(data);
    });

    // when receiving a 'connect' event, send a message to server
    this.socketService.socket.on('connect', () => {
      const message = 'myevent';
      this.socketService.socket.emit(message, { data: "I'm connected!" });
    });
  }


  sendMessage(message: string): void {
  }
  getMessages() {

  }




  ngOnInit(): void {

    this.socketService.getQr().subscribe(hello => {
      console.log(hello);
    })


    this.monitorConnection().subscribe(it => {
      console.log(it);
    })



    

 
  

  }


  private monitorConnection(): Observable<boolean> {
    this.connectionSubject = new BehaviorSubject<boolean>(false);

    this.socketService.socket.on('connect', () => {
      this.connectionSubject.next(true);
    });

    this.socketService.socket.on('connection', () => {
      this.connectionSubject.next(true);
    });

    this.socketService.socket.on('disconnect', () => {
      this.connectionSubject.next(false);
    });

    this.socketService.socket.on('disconnecting', () => {
      this.connectionSubject.next(false);
    });

    return this.connectionSubject.asObservable();
  }
}
