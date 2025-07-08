import express from 'express';
import bodyParser from 'body-parser';
import routes from './routes/index.js';

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(routes);

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`OAuth2 server is running on http://localhost:${PORT}`);
});
