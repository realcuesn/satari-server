import { config } from 'dotenv';
import { json } from 'express';

export function configureApp(app) {
    config();
    
    // Use JSON middleware 🍔
    app.use(json());

    // ⚙️ Configure your app here (e.g., additional middleware, routes, etc.) 🧰
    // Example: app.use(bodyParser.json());
}
