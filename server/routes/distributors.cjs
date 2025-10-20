const express = require('express');
const router = express.Router();

module.exports = (db) => {

// GET /api/distributors - Get all distributors
router.get('/', async (req, res) => {
  try {
    const { status, limit = 100 } = req.query;
    
    let query = db('distributors')
      .select('*')
      .orderBy('name')
      .limit(parseInt(limit));

    if (status) {
      query = query.where('status', status);
    }

    const distributors = await query;
    
    res.json({
      success: true,
      data: distributors,
      count: distributors.length
    });
  } catch (error) {
    console.error('Error fetching distributors:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch distributors'
    });
  }
});

// GET /api/distributors/:id - Get distributor by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const distributor = await db('distributors')
      .where('id', id)
      .first();
    
    if (!distributor) {
      return res.status(404).json({
        success: false,
        message: 'Distributor not found'
      });
    }
    
    res.json({
      success: true,
      data: distributor
    });
  } catch (error) {
    console.error('Error fetching distributor:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch distributor'
    });
  }
});

// POST /api/distributors - Create new distributor
router.post('/', async (req, res) => {
  try {
    const distributorData = req.body;
    
    // Validate required fields
    if (!distributorData.name || !distributorData.contact_person || !distributorData.email) {
      return res.status(400).json({
        success: false,
        message: 'Name, contact person, and email are required'
      });
    }
    
    // Set default values
    distributorData.status = distributorData.status || 'pending';
    distributorData.created_at = new Date().toISOString();
    distributorData.updated_at = new Date().toISOString();
    
    const [distributorId] = await db('distributors').insert(distributorData);
    
    // Fetch the created distributor
    const newDistributor = await db('distributors')
      .where('id', distributorId)
      .first();
    
    // Log system activity
    try {
      await db('system_activity').insert({
        user_id: req.body.userId || 1,
        user_email: req.body.userEmail || 'unknown',
        action: 'DISTRIBUTOR_CREATED',
        details: `Created distributor: ${newDistributor.name}`,
        ip_address: req.ip || '127.0.0.1',
        user_agent: req.get('User-Agent') || 'Unknown',
        activity_type: 'DISTRIBUTOR_MANAGEMENT',
        created_at: new Date().toISOString()
      });
    } catch (logError) {
      console.error('Error logging system activity:', logError);
    }
    
    res.status(201).json({
      success: true,
      data: newDistributor,
      message: 'Distributor created successfully'
    });
  } catch (error) {
    console.error('Error creating distributor:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create distributor'
    });
  }
});

// PUT /api/distributors/:id - Update distributor
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Remove fields that shouldn't be updated directly
    delete updateData.id;
    delete updateData.created_at;
    delete updateData.userId;
    delete updateData.userEmail;
    
    updateData.updated_at = new Date().toISOString();
    
    await db('distributors').where('id', id).update(updateData);
    
    // Fetch the updated distributor
    const updatedDistributor = await db('distributors')
      .where('id', id)
      .first();
    
    // Log system activity
    try {
      await db('system_activity').insert({
        user_id: req.body.userId || 1,
        user_email: req.body.userEmail || 'unknown',
        action: 'DISTRIBUTOR_UPDATED',
        details: `Updated distributor: ${updatedDistributor.name}`,
        ip_address: req.ip || '127.0.0.1',
        user_agent: req.get('User-Agent') || 'Unknown',
        activity_type: 'DISTRIBUTOR_MANAGEMENT',
        created_at: new Date().toISOString()
      });
    } catch (logError) {
      console.error('Error logging system activity:', logError);
    }
    
    res.json({
      success: true,
      data: updatedDistributor,
      message: 'Distributor updated successfully'
    });
  } catch (error) {
    console.error('Error updating distributor:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update distributor'
    });
  }
});

// DELETE /api/distributors/:id - Delete distributor
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get distributor info before deletion for logging
    const distributor = await db('distributors')
      .where('id', id)
      .first();
    
    if (!distributor) {
      return res.status(404).json({
        success: false,
        message: 'Distributor not found'
      });
    }
    
    await db('distributors').where('id', id).del();
    
    // Log system activity
    try {
      await db('system_activity').insert({
        user_id: req.body.userId || 1,
        user_email: req.body.userEmail || 'unknown',
        action: 'DISTRIBUTOR_DELETED',
        details: `Deleted distributor: ${distributor.name}`,
        ip_address: req.ip || '127.0.0.1',
        user_agent: req.get('User-Agent') || 'Unknown',
        activity_type: 'DISTRIBUTOR_MANAGEMENT',
        created_at: new Date().toISOString()
      });
    } catch (logError) {
      console.error('Error logging system activity:', logError);
    }
    
    res.json({
      success: true,
      message: 'Distributor deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting distributor:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete distributor'
    });
  }
});

  return router;
};
