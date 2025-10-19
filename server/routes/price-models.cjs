const express = require('express');
const router = express.Router();

module.exports = (db) => {
  // Get all price models
  router.get('/', async (req, res) => {
    try {
      const priceModels = await db('price_models')
        .select('*')
        .orderBy('created_at', 'desc');

      res.json({
        success: true,
        data: priceModels
      });
    } catch (error) {
      console.error('Error fetching price models:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch price models'
      });
    }
  });

  // Get a specific price model
  router.get('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const priceModel = await db('price_models')
        .where('id', id)
        .first();

      if (!priceModel) {
        return res.status(404).json({
          success: false,
          message: 'Price model not found'
        });
      }

      res.json({
        success: true,
        data: priceModel
      });
    } catch (error) {
      console.error('Error fetching price model:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch price model'
      });
    }
  });

  // Create a new price model
  router.post('/', async (req, res) => {
    try {
      const {
        name,
        description,
        base_price,
        min_quantity,
        max_quantity,
        customer_type,
        is_active,
        created_by
      } = req.body;

      // Validate required fields
      if (!name || !base_price || !customer_type) {
        return res.status(400).json({
          success: false,
          message: 'Name, base price, and customer type are required'
        });
      }

      const [priceModelId] = await db('price_models').insert({
        name,
        description: description || '',
        base_price: parseFloat(base_price),
        min_quantity: parseInt(min_quantity) || 1,
        max_quantity: parseInt(max_quantity) || 999999,
        customer_type,
        is_active: is_active !== false,
        created_by: created_by || 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      // Log system activity
      await db('system_activity').insert({
        user_id: created_by || 1,
        user_email: req.body.userEmail || 'unknown',
        activity_type: 'PRICE_MODEL_CREATED',
        description: `Price model "${name}" created with base price ₦${base_price}`,
        ip_address: req.ip,
        user_agent: req.get('User-Agent'),
        timestamp: new Date().toISOString(),
        created_at: new Date().toISOString()
      });

      const newPriceModel = await db('price_models')
        .where('id', priceModelId)
        .first();

      res.status(201).json({
        success: true,
        data: newPriceModel,
        message: 'Price model created successfully'
      });
    } catch (error) {
      console.error('Error creating price model:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create price model'
      });
    }
  });

  // Update a price model
  router.put('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const {
        name,
        description,
        base_price,
        min_quantity,
        max_quantity,
        customer_type,
        is_active,
        updated_by
      } = req.body;

      // Check if price model exists
      const existingModel = await db('price_models')
        .where('id', id)
        .first();

      if (!existingModel) {
        return res.status(404).json({
          success: false,
          message: 'Price model not found'
        });
      }

      // Update the price model
      await db('price_models')
        .where('id', id)
        .update({
          name: name || existingModel.name,
          description: description !== undefined ? description : existingModel.description,
          base_price: base_price !== undefined ? parseFloat(base_price) : existingModel.base_price,
          min_quantity: min_quantity !== undefined ? parseInt(min_quantity) : existingModel.min_quantity,
          max_quantity: max_quantity !== undefined ? parseInt(max_quantity) : existingModel.max_quantity,
          customer_type: customer_type || existingModel.customer_type,
          is_active: is_active !== undefined ? is_active : existingModel.is_active,
          updated_at: new Date().toISOString()
        });

      // Log system activity
      await db('system_activity').insert({
        user_id: updated_by || 1,
        user_email: req.body.userEmail || 'unknown',
        activity_type: 'PRICE_MODEL_UPDATED',
        description: `Price model "${name || existingModel.name}" updated`,
        ip_address: req.ip,
        user_agent: req.get('User-Agent'),
        timestamp: new Date().toISOString(),
        created_at: new Date().toISOString()
      });

      const updatedModel = await db('price_models')
        .where('id', id)
        .first();

      res.json({
        success: true,
        data: updatedModel,
        message: 'Price model updated successfully'
      });
    } catch (error) {
      console.error('Error updating price model:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update price model'
      });
    }
  });

  // Delete a price model
  router.delete('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { deleted_by } = req.body;

      // Check if price model exists
      const existingModel = await db('price_models')
        .where('id', id)
        .first();

      if (!existingModel) {
        return res.status(404).json({
          success: false,
          message: 'Price model not found'
        });
      }

      // Delete the price model
      await db('price_models')
        .where('id', id)
        .del();

      // Log system activity
      await db('system_activity').insert({
        user_id: deleted_by || 1,
        user_email: req.body.userEmail || 'unknown',
        activity_type: 'PRICE_MODEL_DELETED',
        description: `Price model "${existingModel.name}" deleted`,
        ip_address: req.ip,
        user_agent: req.get('User-Agent'),
        timestamp: new Date().toISOString(),
        created_at: new Date().toISOString()
      });

      res.json({
        success: true,
        message: 'Price model deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting price model:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete price model'
      });
    }
  });

  return router;
};
