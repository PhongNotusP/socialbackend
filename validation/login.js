const Validator = require('validator');
const isEmpty = require('../utils/isEmpty');

module.exports = function ValidateLoginInput(data){
  let errors = {};

  data.email = !isEmpty(data.email) ? data.email : '';
  data.password = !isEmpty(data.password) ? data.password : '';

  if(!Validator.isEmail(data.email)){
    errors.email ='Email không đúng định dạng';
  }
  if(Validator.isEmpty(data.email)){
    errors.email ='Email không được để trống';
  }
  if(Validator.isEmpty(data.password)){
    errors.password ='Mật khẩu không được để trống';
  }
  
  return {
    errors,
    isValid: isEmpty(errors)
  }
}