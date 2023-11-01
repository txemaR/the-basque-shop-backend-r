# The Basque Shop - Servidor de Mi Aplicación Web

**Descripción**:
El Servidor de Mi Aplicación Web es una parte esencial de "The Basque Shop", mi Proyecto Final de Ecommerce para el Curso Full Stack Developer. Este servidor se encarga de manejar las solicitudes de los usuarios, gestionar la autenticación, proporcionar acceso a la base de datos y mucho más.

**Características Destacadas**:

- **Registro de Usuarios**: Los usuarios pueden registrarse en la plataforma proporcionando su nombre, dirección de correo electrónico y contraseña. El servidor almacena de manera segura la información del usuario y les permite iniciar sesión en futuras visitas.

- **Inicio de Sesión Seguro**: La aplicación implementa un inicio de sesión seguro, donde los usuarios pueden autenticarse utilizando su dirección de correo electrónico y contraseña. La seguridad de las contraseñas se mejora mediante el uso de hash con bcrypt.

- **Carrito de Compras**: Los usuarios pueden agregar productos al carrito de compras, aumentar o disminuir la cantidad de elementos y eliminar productos del carrito.

- **Productos de Tienda**: Los productos de la tienda se obtienen de una base de datos MySQL y se muestran en la plataforma. Las imágenes de los productos se almacenan y se entregan en formato base64.

- **Gestión de Sesiones**: El servidor maneja las sesiones de usuario de manera eficiente para rastrear si un usuario está conectado o no. Los usuarios pueden cerrar sesión en cualquier momento.

- **Rutas API**: El servidor proporciona una serie de rutas API para acceder a los datos de la aplicación, como productos, carrito de compras y autenticación.

**Tecnologías Utilizadas**:
- Node.js y Express.js para la creación del servidor.
- MySQL como base de datos para almacenar datos de usuarios y productos.
- Bcrypt para la encriptación segura de contraseñas.
- Middleware de sesión y cookies para gestionar la autenticación y las sesiones de usuario.

**Licencia**:
Este proyecto está bajo la Licencia MIT, lo que significa que es de código abierto y puedes utilizarlo y modificarlo según tus necesidades, siempre y cuando sigas los términos de la licencia.
