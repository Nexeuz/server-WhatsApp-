import { EventEmitter, Injectable, Output } from '@angular/core';
import { Observable, tap } from 'rxjs';

import { io, Socket } from 'socket.io-client';
import { environment } from '../environment';


@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  socket: Socket | undefined;


  connect() {
    this.socket = io(environment.serverSocket)
  }


  getQr() {

    setInterval(() => {
      this.socket?.emit('please', 'saassa')
    }, 3000);

    return new Observable(observer => {
      this.socket?.on('please', (message) => {
        debugger
          observer.next(message)
      })
    })

  }




}
