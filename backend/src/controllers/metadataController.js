// Simplified metadata controller - returns empty data for now
// University/college metadata can be added back when needed

exports.getUniversities = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: []
    });
  } catch (err) {
    console.error('GetUniversities error:', err.message);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

exports.getFaculties = async (req, res) => {
  try {
    const { universityCode } = req.params;
    
    if (!universityCode) {
      return res.status(400).json({
        success: false,
        message: 'University code is required'
      });
    }

    res.status(200).json({
      success: true,
      data: []
    });
  } catch (err) {
    console.error('GetFaculties error:', err.message);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

exports.getPrograms = async (req, res) => {
  try {
    const { universityCode, facultyCode } = req.params;
    
    if (!universityCode || !facultyCode) {
      return res.status(400).json({
        success: false,
        message: 'University code and faculty code are required'
      });
    }

    res.status(200).json({
      success: true,
      data: []
    });
  } catch (err) {
    console.error('GetPrograms error:', err.message);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

exports.getUniversityConfig = async (req, res) => {
  try {
    const { universityCode } = req.params;
    
    if (!universityCode) {
      return res.status(400).json({
        success: false,
        message: 'University code is required'
      });
    }

    res.status(200).json({
      success: true,
      data: null
    });
  } catch (err) {
    console.error('GetUniversityConfig error:', err.message);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
