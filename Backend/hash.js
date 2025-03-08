const bcrypt = require('bcryptjs');
bcrypt.hash('studentpass', 10, (err, hash) => {
  if (err) throw err;
  console.log(hash);
});
