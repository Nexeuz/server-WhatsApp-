import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { QrCodeModule } from 'ng-qrcode';
import { Socket, io } from 'socket.io-client';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, QrCodeModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  private socket: Socket;
  title = "funciona por favor :(";

  constructor() {
    this.socket = io('http://localhost:3000');
  }

  ngOnInit() {
    // Connect to the backend server

    // Handle events received from the server
    this.socket.on('event-1', (data) => {
      console.log('Received event-1:', data);
    });

    // Emit events to the server
    this.socket.emit('event2', 'Hello from the client!');
  }
}

