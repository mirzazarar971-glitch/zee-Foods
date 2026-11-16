import { Router } from 'express';
import {
  updateProfile,
  changePassword,
  addAddress,
  updateAddress,
  deleteAddress,
} from '../controllers/userController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { updateProfileSchema, changePasswordSchema, addressSchema } from '../utils/schemas.js';

const router = Router();
router.use(protect);

router.put('/me', validate(updateProfileSchema), updateProfile);
router.put('/me/password', validate(changePasswordSchema), changePassword);
router.post('/me/addresses', validate(addressSchema), addAddress);
router.put('/me/addresses/:addressId', validate(addressSchema), updateAddress);
router.delete('/me/addresses/:addressId', deleteAddress);

export default router;
