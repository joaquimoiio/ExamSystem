const { ExamHeader } = require('../models');
const { catchAsync, AppError } = require('../utils/appError');
const { paginate, buildPaginationMeta } = require('../utils/helpers');

// Get all exam headers for user
const getExamHeaders = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 10 } = req.query;
  const { limit: queryLimit, offset } = paginate(page, limit);

  const { count, rows: headers } = await ExamHeader.findAndCountAll({
    where: { userId: req.user.id },
    limit: queryLimit,
    offset,
    order: [['isDefault', 'DESC'], ['createdAt', 'DESC']]
  });

  const pagination = buildPaginationMeta(page, limit, count);

  res.json({
    success: true,
    data: { headers, pagination }
  });
});

// Get exam header by ID
const getExamHeaderById = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const header = await ExamHeader.findOne({
    where: { id, userId: req.user.id }
  });

  if (!header) {
    return next(new AppError('Cabeçalho de prova não encontrado', 404));
  }

  res.json({
    success: true,
    data: { header }
  });
});

// Create exam header
const createExamHeader = catchAsync(async (req, res, next) => {
  const {
    schoolName,
    subjectName,
    year,
    evaluationCriteria,
    instructions,
    timeLimit,
    isDefault = false
  } = req.body;

  // Se for para ser o padrão, remove o padrão dos outros
  if (isDefault) {
    await ExamHeader.update(
      { isDefault: false },
      { where: { userId: req.user.id } }
    );
  }

  const header = await ExamHeader.create({
    schoolName,
    subjectName,
    year,
    evaluationCriteria,
    instructions,
    timeLimit,
    isDefault,
    userId: req.user.id
  });

  res.status(201).json({
    success: true,
    data: { header }
  });
});

// Update exam header
const updateExamHeader = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const {
    schoolName,
    subjectName,
    year,
    evaluationCriteria,
    instructions,
    timeLimit,
    isDefault
  } = req.body;

  const header = await ExamHeader.findOne({
    where: { id, userId: req.user.id }
  });

  if (!header) {
    return next(new AppError('Cabeçalho de prova não encontrado', 404));
  }

  // Se for para ser o padrão, remove o padrão dos outros
  if (isDefault && !header.isDefault) {
    await ExamHeader.update(
      { isDefault: false },
      { where: { userId: req.user.id } }
    );
  }

  await header.update({
    schoolName,
    subjectName,
    year,
    evaluationCriteria,
    instructions,
    timeLimit,
    isDefault
  });

  res.json({
    success: true,
    data: { header }
  });
});

// Delete exam header
const deleteExamHeader = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const header = await ExamHeader.findOne({
    where: { id, userId: req.user.id }
  });

  if (!header) {
    return next(new AppError('Cabeçalho de prova não encontrado', 404));
  }

  // Não permitir deletar se for o único cabeçalho padrão
  if (header.isDefault) {
    const otherHeaders = await ExamHeader.count({
      where: { userId: req.user.id, id: { [require('sequelize').Op.ne]: id } }
    });

    if (otherHeaders === 0) {
      return next(new AppError('Não é possível deletar o único cabeçalho. Crie outro primeiro.', 400));
    }

    // Se deletar o padrão, definir outro como padrão
    const nextHeader = await ExamHeader.findOne({
      where: { userId: req.user.id, id: { [require('sequelize').Op.ne]: id } },
      order: [['createdAt', 'DESC']]
    });

    if (nextHeader) {
      await nextHeader.update({ isDefault: true });
    }
  }

  await header.destroy();

  res.json({
    success: true,
    message: 'Cabeçalho de prova deletado com sucesso'
  });
});

// Get default exam header
const getDefaultExamHeader = catchAsync(async (req, res, next) => {
  const header = await ExamHeader.findOne({
    where: { userId: req.user.id, isDefault: true }
  });

  if (!header) {
    return next(new AppError('Nenhum cabeçalho padrão encontrado', 404));
  }

  res.json({
    success: true,
    data: { header }
  });
});

// Set as default
const setAsDefault = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const header = await ExamHeader.findOne({
    where: { id, userId: req.user.id }
  });

  if (!header) {
    return next(new AppError('Cabeçalho de prova não encontrado', 404));
  }

  // Remove default de todos os outros
  await ExamHeader.update(
    { isDefault: false },
    { where: { userId: req.user.id } }
  );

  // Define este como padrão
  await header.update({ isDefault: true });

  res.json({
    success: true,
    data: { header }
  });
});

module.exports = {
  getExamHeaders,
  getExamHeaderById,
  createExamHeader,
  updateExamHeader,
  deleteExamHeader,
  getDefaultExamHeader,
  setAsDefault
};