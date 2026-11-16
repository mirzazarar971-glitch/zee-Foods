import User from '../models/User.js';
import { ApiError } from '../middleware/auth.js';
import { asyncHandler } from '../utils/helpers.js';

export const updateProfile = asyncHandler(async (req, res) => {
  const { name, email, phone } = req.body;
  if (email && email !== req.user.email) {
    const taken = await User.findOne({ email, _id: { $ne: req.user._id } });
    if (taken) throw new ApiError(409, 'That email is already in use.');
  }
  req.user.name = name ?? req.user.name;
  req.user.email = email ?? req.user.email;
  req.user.phone = phone ?? req.user.phone;
  await req.user.save();
  res.json({ success: true, user: req.user.toSafeJSON() });
});

export const changePassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+password');
  const ok = await user.comparePassword(req.body.currentPassword);
  if (!ok) throw new ApiError(400, 'Current password is incorrect.');
  user.password = req.body.newPassword;
  await user.save();
  res.json({ success: true, message: 'Password updated successfully.' });
});

export const addAddress = asyncHandler(async (req, res) => {
  const payload = { ...req.body };
  const isFirst = req.user.addresses.length === 0;
  if (isFirst || payload.isDefault) {
    req.user.addresses.forEach((address) => {
      address.isDefault = false;
    });
    payload.isDefault = true;
  }
  req.user.addresses.push(payload);
  await req.user.save();
  res.status(201).json({ success: true, addresses: req.user.addresses });
});

export const updateAddress = asyncHandler(async (req, res) => {
  const address = req.user.addresses.id(req.params.addressId);
  if (!address) throw new ApiError(404, 'Address not found.');
  Object.assign(address, req.body);
  if (req.body.isDefault) {
    req.user.addresses.forEach((item) => {
      if (!item._id.equals(address._id)) item.isDefault = false;
    });
    address.isDefault = true;
  }
  if (!req.user.addresses.some((item) => item.isDefault)) address.isDefault = true;
  await req.user.save();
  res.json({ success: true, addresses: req.user.addresses });
});

export const deleteAddress = asyncHandler(async (req, res) => {
  const address = req.user.addresses.id(req.params.addressId);
  if (!address) throw new ApiError(404, 'Address not found.');
  const wasDefault = address.isDefault;
  address.deleteOne();
  if (wasDefault && req.user.addresses.length) req.user.addresses[0].isDefault = true;
  await req.user.save();
  res.json({ success: true, addresses: req.user.addresses });
});
