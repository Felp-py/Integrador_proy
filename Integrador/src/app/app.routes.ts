import { Routes } from '@angular/router';
import { Cajero } from './cajero/cajero';
import { IntegradorDisplay } from './integrador-display/integrador-display';

export const routes: Routes = [
    { path: '', redirectTo: 'cajero', pathMatch: 'full' },
    { path: 'cajero', component: Cajero },
    { path: 'cocina', component: IntegradorDisplay }
];