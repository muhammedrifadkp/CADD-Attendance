const PC = require('../models/pcModel');

// @desc    Create a new PC
// @route   POST /api/lab/pcs
// @access  Private/Admin/Lab-Teacher
const createPC = async (req, res) => {
  try {
    const { pcNumber, rowNumber, specifications, notes } = req.body;

    // Check if PC number already exists
    const pcExists = await PC.findOne({ pcNumber });
    if (pcExists) {
      return res.status(400).json({ message: 'PC number already exists' });
    }

    const pc = await PC.create({
      pcNumber,
      rowNumber,
      specifications: specifications || {},
      notes,
      createdBy: req.user._id,
    });

    res.status(201).json(pc);
  } catch (error) {
    console.error('Error creating PC:', error);
    res.status(500).json({ message: 'Server error creating PC' });
  }
};

// @desc    Get all PCs
// @route   GET /api/lab/pcs
// @access  Private/Lab Access
const getPCs = async (req, res) => {
  try {
    const { row, status } = req.query;

    let filter = {};
    if (row) filter.rowNumber = row;
    if (status) filter.status = status;

    const pcs = await PC.find(filter)
      .populate('createdBy', 'name email')
      .sort({ rowNumber: 1, pcNumber: 1 });

    res.json(pcs);
  } catch (error) {
    console.error('Error fetching PCs:', error);
    res.status(500).json({ message: 'Server error fetching PCs' });
  }
};

// @desc    Get PC by ID
// @route   GET /api/lab/pcs/:id
// @access  Private/Lab Access
const getPCById = async (req, res) => {
  try {
    const pc = await PC.findById(req.params.id).populate('createdBy', 'name email');

    if (!pc) {
      return res.status(404).json({ message: 'PC not found' });
    }

    res.json(pc);
  } catch (error) {
    console.error('Error fetching PC:', error);
    res.status(500).json({ message: 'Server error fetching PC' });
  }
};

// @desc    Update PC
// @route   PUT /api/lab/pcs/:id
// @access  Private/Admin/Lab-Teacher
const updatePC = async (req, res) => {
  try {
    const { pcNumber, rowNumber, status, specifications, lastMaintenance, notes } = req.body;

    const pc = await PC.findById(req.params.id);

    if (!pc) {
      return res.status(404).json({ message: 'PC not found' });
    }

    // Check if new PC number already exists (if changing)
    if (pcNumber && pcNumber !== pc.pcNumber) {
      const pcExists = await PC.findOne({ pcNumber });
      if (pcExists) {
        return res.status(400).json({ message: 'PC number already exists' });
      }
    }

    // Update fields
    if (pcNumber) pc.pcNumber = pcNumber;
    if (rowNumber) pc.rowNumber = rowNumber;
    if (status) pc.status = status;
    if (specifications) pc.specifications = { ...pc.specifications, ...specifications };
    if (lastMaintenance) pc.lastMaintenance = lastMaintenance;
    if (notes !== undefined) pc.notes = notes;

    const updatedPC = await pc.save();
    await updatedPC.populate('createdBy', 'name email');

    res.json(updatedPC);
  } catch (error) {
    console.error('Error updating PC:', error);
    res.status(500).json({ message: 'Server error updating PC' });
  }
};

// @desc    Delete PC
// @route   DELETE /api/lab/pcs/:id
// @access  Private/Admin/Lab-Teacher
const deletePC = async (req, res) => {
  try {
    const pc = await PC.findById(req.params.id);

    if (!pc) {
      return res.status(404).json({ message: 'PC not found' });
    }

    await PC.findByIdAndDelete(req.params.id);
    res.json({ message: 'PC deleted successfully' });
  } catch (error) {
    console.error('Error deleting PC:', error);
    res.status(500).json({ message: 'Server error deleting PC' });
  }
};

// @desc    Get PCs grouped by row
// @route   GET /api/lab/pcs/by-row
// @access  Private/Lab Access
const getPCsByRow = async (req, res) => {
  try {
    const pcs = await PC.find({ status: { $ne: 'inactive' } })
      .populate('createdBy', 'name email')
      .sort({ rowNumber: 1, pcNumber: 1 });

    // Group PCs by row
    const pcsByRow = pcs.reduce((acc, pc) => {
      const row = pc.rowNumber;
      if (!acc[row]) {
        acc[row] = [];
      }
      acc[row].push(pc);
      return acc;
    }, {});

    res.json(pcsByRow);
  } catch (error) {
    console.error('Error fetching PCs by row:', error);
    res.status(500).json({ message: 'Server error fetching PCs by row' });
  }
};

// @desc    Clear all PCs (for reset)
// @route   DELETE /api/lab/pcs/clear-all
// @access  Private/Admin/Lab-Teacher
const clearAllPCs = async (req, res) => {
  try {
    await PC.deleteMany({});
    res.json({ message: 'All PCs cleared successfully' });
  } catch (error) {
    console.error('Error clearing PCs:', error);
    res.status(500).json({ message: 'Server error clearing PCs' });
  }
};

module.exports = {
  createPC,
  getPCs,
  getPCById,
  updatePC,
  deletePC,
  getPCsByRow,
  clearAllPCs,
};
