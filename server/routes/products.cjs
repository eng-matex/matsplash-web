const express = require('express');
const router = express.Router();

module.exports = (db) => {
  // Get all products
  router.get('/', async (req, res) => {
    try {
      const products = await db('products')
        .select('*')
        .orderBy('name');

      res.json({
        success: true,
        data: products
      });

    } catch (error) {
      console.error('Error fetching products:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch products'
      });
    }
  });

  // Get product by ID
  router.get('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      
      const product = await db('products')
        .where('id', id)
        .first();

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      res.json({
        success: true,
        data: product
      });

    } catch (error) {
      console.error('Error fetching product:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch product'
      });
    }
  });

  // Create new product
  router.post('/', async (req, res) => {
    try {
      const productData = req.body;

      const [productId] = await db('products').insert({
        ...productData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      res.status(201).json({
        success: true,
        message: 'Product created successfully',
        data: { id: productId }
      });

    } catch (error) {
      console.error('Error creating product:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create product'
      });
    }
  });

  // Update product
  router.put('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      await db('products')
        .where('id', id)
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        });

      res.json({
        success: true,
        message: 'Product updated successfully'
      });

    } catch (error) {
      console.error('Error updating product:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update product'
      });
    }
  });

  // Delete product
  router.delete('/:id', async (req, res) => {
    try {
      const { id } = req.params;

      await db('products')
        .where('id', id)
        .del();

      res.json({
        success: true,
        message: 'Product deleted successfully'
      });

    } catch (error) {
      console.error('Error deleting product:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete product'
      });
    }
  });

  return router;
};
