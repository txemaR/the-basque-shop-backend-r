const express = require("express");
const cors = require("cors");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const mysql = require("mysql2");
const bcrypt = require("bcrypt");
const app = express();

// Habilitar CORS
app.use(
  cors({
    origin: "https://the-basque-shop-web-00f022bbc568.herokuapp.com",
    credentials: true
  })
);

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
  })
);

// Conexión a MySQL
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT
});

db.connect((err) => {
  if (err) {
    console.error("Error al conectar con MySQL:", err);
  } else {
    console.log("Conexión exitosa a la base de datos MySQL");
  }
});

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Rutas

// Endpoint de registro
app.post("/register", async (req, res) => {
  const { users_name, users_email, users_password } = req.body;

  // Validación de campos
  if (!users_name || !users_email || !users_password) {
    return res.status(400).json({ status: "Campos incompletos" });
  }

  // Encriptar la contraseña
  const hashedPassword = await bcrypt.hash(users_password, 10);

  const sql = "INSERT INTO users (users_name, users_email, users_password) VALUES (?, ?, ?)";
  db.query(sql, [users_name, users_email, hashedPassword], (err, result) => {
    if (err) {
      console.error("Error al registrar usuario:", err);
      res.status(500).json({ status: "Error al registrar usuario" });
    } else {
      console.log("Usuario registrado exitosamente");
      res.status(201).json({ status: "User_created" });
    }
  });
});

// Endpoint de inicio de sesión
app.post("/login", async (req, res) => {
  const { users_email, users_password } = req.body;

  // Validación de campos
  if (!users_email || !users_password) {
    return res.status(400).json({ status: "Campos incompletos" });
  }

  const sql = "SELECT * FROM users WHERE users_email = ?";
  db.query(sql, [users_email], async (err, results) => {
    if (err) {
      console.error("Error al consultar usuario:", err);
      res.status(500).json({ status: "Error al consultar usuario" });
    } else {
      if (results.length === 1) {
        const user = results[0];
        const passwordMatch = await bcrypt.compare(users_password, user.users_password);

        if (passwordMatch) {
          req.session.user = user;
          res.status(200).json({ status: "created" });
        } else {
          res.status(401).json({ status: "Correo electrónico o contraseña incorrectos" });
        }
      } else {
        res.status(401).json({ status: "Correo electrónico o contraseña incorrectos" });
      }
    }
  });
});

// Endpoint para verificar si el usuario está conectado
app.get("/logged_in", (req, res) => {
  if (req.session.user) {
    res.status(200).json({ status: "LOGGED_IN", user: req.session.user });
  } else {
    res.status(401).json({ status: "NOT_LOGGED_IN" });
  }
});

// Endpoint de logout
app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Error al cerrar sesión:", err);
      res.status(500).json({ status: "Error al cerrar sesión" });
      console.log("Error")
    } else {
      res.status(200).json({ status: "Logged out" });
    }
  });
});

// Obtener los productos de la tienda
app.get('/products', (req, res) => {
  if (db._closed) {
    db.connect((err) => {
      if (err) {
        console.error('Error al restablecer la conexión con la base de datos:', err);
        res.status(500).send('Error interno del servidor');
        return;
      }
    });
  }

  db.query('SELECT products_id, products_name, products_description, products_price, products_blob_images FROM products', (err, results) => {
    if (err) {
      console.error('Error al obtener los productos:', err);
      res.status(500).send('Error interno del servidor');
    } else {
      const productsWithBase64Images = results.map((product) => ({
        ...product,
        products_blob_images: product.products_blob_images ? product.products_blob_images.toString('base64') : null
      }));
      res.json(productsWithBase64Images);
    }
  });
});

// Obtener elementos del carrito
app.get('/cart', (req, res) => {
  const sql = 'SELECT cart_product_name, cart_product_price, cart_quantity FROM cart';
  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error al obtener elementos del carrito:', err);
      res.status(500).send('Error interno del servidor');
    } else {
      res.json(results);
    }
  });
});

// Ruta para agregar un producto al carrito
app.post('/add-to-cart', (req, res) => {
  const { products_id, products_name, products_price } = req.body;

  // Verificar si el producto ya existe en el carrito
  const checkProductQuery = 'SELECT * FROM cart WHERE cart_product_name = ?';
  db.query(checkProductQuery, [products_name], (checkErr, checkResults) => {
    if (checkErr) {
      console.error('Error al verificar el producto en el carrito:', checkErr);
      res.status(500).json({ status: 'Error al verificar el producto en el carrito' });
    } else if (checkResults.length > 0) {
      // El producto ya está en el carrito, actualiza la cantidad
      const updateQuantityQuery = 'UPDATE cart SET cart_quantity = cart_quantity + 1 WHERE cart_product_name = ?';
      db.query(updateQuantityQuery, [products_name], (updateErr, updateResults) => {
        if (updateErr) {
          console.error('Error al actualizar la cantidad del producto en el carrito:', updateErr);
          res.status(500).json({ status: 'Error al actualizar la cantidad del producto en el carrito' });
        } else {
          res.json({ status: 'Quantity_updated' });
        }
      });
    } else {
      // El producto no está en el carrito, realiza una inserción
      const insertQuery = 'INSERT INTO cart (cart_product_name, cart_product_price, cart_quantity) VALUES (?, ?, 1)';
      db.query(insertQuery, [products_name, products_price], (insertErr, insertResult) => {
        if (insertErr) {
          console.error('Error al agregar el producto al carrito:', insertErr);
          res.status(500).json({ status: 'Error al agregar el producto al carrito' });
        } else {
          res.json({ status: 'Product_added_to_cart' });
        }
      });
    }
  });
});

// Obtener elementos del carrito desde la base de datos
app.get('/cart-items', (req, res) => {
  const sql = 'SELECT cart_product_name, cart_product_price, cart_quantity, cart_id FROM cart';
  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error al obtener elementos del carrito:', err);
      res.status(500).send('Error interno del servidor');
    } else {
      res.json(results);
    }
  });
});

// Eliminar un elemento del carrito
app.delete('/cart-items/:cartItemId', (req, res) => {
  const cartItemId = req.params.cartItemId;
  const sql = 'DELETE FROM cart WHERE cart_id = ?';
  db.query(sql, [cartItemId], (err, result) => {
    if (err) {
      console.error('Error al eliminar el elemento del carrito:', err);
      res.status(500).json({ status: 'Error al eliminar el elemento del carrito' });
    } else {
      res.json({ status: 'Item_removed_from_cart' });
    }
  });
});

// Aumentar la cantidad de un elemento en el carrito
app.put('/cart-items/increase-quantity/:cartItemId', (req, res) => {
  const cartItemId = req.params.cartItemId;
  const sql = 'UPDATE cart SET cart_quantity = cart_quantity + 1 WHERE cart_id = ?';
  db.query(sql, [cartItemId], (err, result) => {
    if (err) {
      console.error('Error al aumentar la cantidad del elemento del carrito:', err);
      res.status(500).json({ status: 'Error al aumentar la cantidad del elemento del carrito' });
    } else {
      res.json({ status: 'Quantity_increased' });
    }
  });
});

// Disminuir la cantidad de un elemento en el carrito
app.put('/cart-items/decrease-quantity/:cartItemId', (req, res) => {
  const cartItemId = req.params.cartItemId;
  const sql = 'UPDATE cart SET cart_quantity = cart_quantity - 1 WHERE cart_id = ?';
  db.query(sql, [cartItemId], (err, result) => {
    if (err) {
      console.error('Error al disminuir la cantidad del elemento del carrito:', err);
      res.status(500).json({ status: 'Error al disminuir la cantidad del elemento del carrito' });
    } else {
      res.json({ status: 'Quantity_decreased' });
    }
  });
});


// Iniciar el servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`El servidor está en funcionamiento en el puerto ${PORT}`);
});
