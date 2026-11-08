const { Router } = require('express');
const PRODUCTS = [
  { id: 'p1', name: 'Tumbler Kopi 350ml', price: 95000 },
  { id: 'p2', name: 'Kopi Arabika Gayo 200g', price: 58000 },
  {id: 'p3', name: 'Kopi amba ngawi 200g', price: 45000 },
];

const router = Router();

router.get('/', (req, res) => {
  res.json({ products: PRODUCTS });
});

module.exports = { router, PRODUCTS };
