const Document = require('../models/Document');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const { sendResponse } = require('../utils/ApiResponse');
const { uploadBuffer, destroyAsset } = require('../config/cloudinary');

// ─────────────────────────────────────────────────────────────
// POST /api/documents  (multipart: file + metadata fields)
// ─────────────────────────────────────────────────────────────
const uploadDocument = catchAsync(async (req, res) => {
  if (!req.file) throw ApiError.badRequest('No file provided.');

  const { type, title, entityType, entityId, isPrivate } = req.body;
  const isPdfOrDoc = !req.file.mimetype.startsWith('image/');

  const result = await uploadBuffer(req.file.buffer, {
    folder: `propflow/${req.tenantId}/documents`,
    resourceType: isPdfOrDoc ? 'raw' : 'image',
  });

  const document = await Document.create({
    company: req.tenantId,
    type,
    title: title || req.file.originalname,
    url: result.secure_url,
    publicId: result.public_id,
    mimeType: req.file.mimetype,
    sizeBytes: req.file.size,
    relatedEntity: entityType ? { entityType, entityId } : undefined,
    uploadedBy: req.user._id,
    isPrivate: isPrivate !== 'false',
  });

  sendResponse(res, 201, 'Document uploaded successfully.', document);
});

// ─────────────────────────────────────────────────────────────
// GET /api/documents?entityType=Property&entityId=...
// ─────────────────────────────────────────────────────────────
const listDocuments = catchAsync(async (req, res) => {
  const filter = { company: req.tenantId };
  if (req.query.entityType) filter['relatedEntity.entityType'] = req.query.entityType;
  if (req.query.entityId) filter['relatedEntity.entityId'] = req.query.entityId;
  if (req.query.type) filter.type = req.query.type;

  const documents = await Document.find(filter).sort({ createdAt: -1 }).populate('uploadedBy', 'name avatar');
  sendResponse(res, 200, 'Documents fetched successfully.', documents);
});

// ─────────────────────────────────────────────────────────────
// DELETE /api/documents/:id
// ─────────────────────────────────────────────────────────────
const deleteDocument = catchAsync(async (req, res) => {
  const document = await Document.findOne({ _id: req.params.id, company: req.tenantId });
  if (!document) throw ApiError.notFound('Document not found.');

  await destroyAsset(document.publicId, document.mimeType?.startsWith('image/') ? 'image' : 'raw').catch(() => {});
  await document.deleteOne();

  sendResponse(res, 200, 'Document deleted successfully.');
});

module.exports = { uploadDocument, listDocuments, deleteDocument };
