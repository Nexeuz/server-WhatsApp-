import { ApplicationConfig, importProvidersFrom, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { SocketIoConfig, SocketIoModule } from 'ngx-socket-io';
import { environment } from './environment';

const config: SocketIoConfig = { url: `${environment.serverSocket}`, options: {} };


export const appConfig: ApplicationConfig = {
  providers: [provideZoneChangeDetection({ eventCoalescing: true }), provideRouter(routes), importProvidersFrom(SocketIoModule.forRoot(config))]
};
