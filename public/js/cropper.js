const Cropper = require('cropperjs');
const image=document.getElementById('cropImage')
console.log(image);
const cropper=new Cropper(image,{
  aspectRatio: 0,
  viewMode:0,
});
document.getElementById('cropImageBtn').addEventListener('click',function(){
  var croppedImage=cropper.getCroppedCanvas().toDataURL('image/png');
  document.getElementById('output').src=croppedImage
})