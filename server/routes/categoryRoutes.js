import { Router } from 'express';
import { publicCategories } from '../controllers/categoryController.js';

const router = Router();
router.get('/', publicCategories);

export default router;
