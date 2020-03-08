const User = require('../models/User');
async function checkPerm(user, permission) {
  const check = User.findById(user.id).populate('perm');
  if (check) {
    if (check.permission.name === permission) {
      return 'Ok';
    } else {
      throw new Error('Bạn không có quyền truy cập');
    }
  } else {
    throw new Error('Tài khoản không tồn tại');
  }
}
module.exports = { checkPerm }