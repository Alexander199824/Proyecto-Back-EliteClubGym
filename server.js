
// Archivo: server.js
//  creo el servidor principal de la aplicación Elite Fitness Club

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

// Importar configuración de base de datos
const { sequelize, connectDB, recreateTablesIfRequested } = require('./src/config/database');

// Crear aplicación Express
const app = express();

// Configuración del puerto
const PORT = process.env.PORT || 5000;

// Middleware de seguridad
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Configurar CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Configurar rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por ventana de tiempo
  message: {
    error: 'Demasiadas solicitudes desde esta IP, intenta de nuevo en 15 minutos.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Middleware de parsing
app.use(express.json({ limit: '10mb' })); // Limite para imágenes en base64
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging en desarrollo
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Ruta de salud del servidor
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Servidor Elite Fitness Club funcionando correctamente',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Ruta principal
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API Elite Fitness Club - Sistema de Gestión Administrativa',
    version: '1.0.0',
    documentation: '/api/docs',
    health: '/health'
  });
});

// Aquí irán las rutas de la API cuando las creemos
// app.use('/api/auth', require('./src/routes/authRoutes'));
// app.use('/api/clients', require('./src/routes/clientRoutes'));
// ... más rutas

// Middleware de manejo de errores
app.use((err, req, res, next) => {
  console.error('Error del servidor:', err.stack);
  
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'Error interno del servidor' 
      : err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Middleware para rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Ruta ${req.originalUrl} no encontrada`
  });
});

// Función para inicializar el servidor
async function startServer() {
  try {
    console.log('🚀 Iniciando servidor Elite Fitness Club...');
    
    // Conectar a la base de datos
    await connectDB();
    
    // Verificar si necesitamos recrear las tablas
    await recreateTablesIfRequested();
    
    // Iniciar el servidor
    const server = app.listen(PORT, () => {
      console.log(`✅ Servidor ejecutándose en puerto ${PORT}`);
      console.log(`🌍 URL: http://localhost:${PORT}`);
      console.log(`📊 Entorno: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🗄️  Base de datos: ${process.env.DB_NAME || 'elite_fitness_db'}`);
    });

    // Manejo de cierre graceful
    process.on('SIGTERM', () => {
      console.log('🔄 Recibida señal SIGTERM, cerrando servidor...');
      server.close(() => {
        console.log('✅ Servidor cerrado correctamente');
        sequelize.close();
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      console.log('🔄 Recibida señal SIGINT, cerrando servidor...');
      server.close(() => {
        console.log('✅ Servidor cerrado correctamente');
        sequelize.close();
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('❌ Error al inicializar el servidor:', error);
    process.exit(1);
  }
}

// Inicializar el servidor solo si este archivo se ejecuta directamente
if (require.main === module) {
  startServer();
}

// Exportar la app para testing
module.exports = app;