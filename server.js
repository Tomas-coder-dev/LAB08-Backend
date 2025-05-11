require('dotenv').config();
const express = require('express');
const cors    = require('cors');

const pool = require('./db');            // <— nuestro pool de pg
const authRoutes  = require('./routes/auth');
const adminRoutes = require('./routes/admin');

const app = express();
app.use(cors());
app.use(express.json());

// Inyectamos el pool en cada req para usarlo en las rutas
app.use((req, _, next) => {
  req.pool = pool;
  next();
});

app.use('/api/auth',  authRoutes);
app.use('/api/admin', adminRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () =>
  console.log(`🚀 API corriendo en puerto ${PORT}`)
);
