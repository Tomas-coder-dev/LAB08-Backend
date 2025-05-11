const express = require('express');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const router  = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { username, password, role } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'Faltan datos' });
  }

  try {
    // 1) Revisar existencia
    const exists = await req.pool.query(
      'SELECT 1 FROM users WHERE username = $1',
      [username]
    );
    if (exists.rowCount) {
      return res.status(400).json({ message: 'Usuario ya existe' });
    }

    // 2) Hashear contraseña
    const hashed = await bcrypt.hash(password, 10);

    // 3) Insertar usuario
    const result = await req.pool.query(
      `INSERT INTO users (username, password, role)
       VALUES ($1, $2, $3)
       RETURNING id, username, role`,
      [username, hashed, role]
    );

    return res.status(201).json({
      message: 'Usuario registrado con éxito',
      user: result.rows[0]
    });

  } catch (err) {
    console.error('Error en register:', err);
    return res.status(500).json({ message: 'Error en la base de datos' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'Faltan datos' });
  }

  try {
    // 1) Buscar usuario
    const { rows } = await req.pool.query(
      'SELECT id, username, password, role FROM users WHERE username = $1',
      [username]
    );
    if (!rows.length) {
      return res.status(400).json({ message: 'Usuario no encontrado' });
    }
    const user = rows[0];

    // 2) Verificar contraseña
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(400).json({ message: 'Contraseña incorrecta' });
    }

    // 3) Firmar JWT
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    return res.json({
      token,
      username: user.username,
      role: user.role
    });

  } catch (err) {
    console.error('Error en login:', err);
    return res.status(500).json({ message: 'Error en la base de datos' });
  }
});

module.exports = router;
