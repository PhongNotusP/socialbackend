const Validator = require('validator');
const isEmpty = require('../utils/isEmpty');

module.exports = function ValidateCreateEvent(data){
  let errors = {};

  data.name = !isEmpty(data.name) ? data.name : '';
  data.introduction = !isEmpty(data.introduction) ? data.introduction: '';


  if(!Validator.isLength(data.name, {min: 1, max: 50})){
    errors.name ='Tên sự kiện phải hơn 1 ký tự';
  }
  if(Validator.isEmpty(data.name)){
    errors.name ='Tên không được để trống';
  }
  if(Validator.isEmpty(data.introduction)){
    errors.introduction ='Thêm giới thiệu về sự kiện';
  }

  return {
    errors,
    isValid: isEmpty(errors)
  }
}