import React, { useRef, useState, useEffect } from 'react';

import Button from './Button';
import './ImageUpload.css';

const ImageUpload = (props) => {
  const [file, setFile] = useState(); //the value of the input elment with type="file", see below
  const [previewUrl, setPreviewUrl] = useState();
  const [isValid, setIsValid] = useState(false);

  const filePickerRef = useRef();

  useEffect(() => {
    if (!file) {
      return;
    }

    // 3 endpoints and 2 ways: frontend -- browser -- backend
    const fileReader = new FileReader(); // browser side javascript

    // convert a binary file to a readable/outputable image
    fileReader.onload = () => { //will be executed after fileReader.readAsDataURL()
      // console.log(`fileReader.result: ${fileReader.result}`);
      setPreviewUrl(fileReader.result);
    };
    fileReader.readAsDataURL(file); // Argument file becomes a base64 encoded string
  }, [file]);

  // To preview the selected picture and forward it to the surrounding form
  // where we use the image upload
  const pickHandler = (event) => {
    let pickedFile;
    let fileIsValid = isValid;
    // files come from the file input
    // you did choose a file from the file dialogbox
    if (event.target.files && event.target.files.length === 1) {
      pickedFile = event.target.files[0];
      setFile(pickedFile);
      setIsValid(true); // isValid will NOT be immediately set to true,
      fileIsValid = true; // so we need this line.
    } else {
      setIsValid(false);
      fileIsValid = false; // ditto
    }

    props.onInput(props.id, pickedFile, fileIsValid);
  };

  // To choose a file from local directory tree dialogbox
  const pickImageHandler = () => {
    filePickerRef.current.click(); //simulate a click or an automatic click
  };

  return (
    <div className='form-control'>
      <input
        id={props.id}
        ref={filePickerRef}
        style={{ display: 'none' }}
        type='file'
        accept='.jpg,.png,.jpeg'
        onChange={pickHandler}
      />
      <div className={`image-upload ${props.center && 'center'}`}>
        <div className='image-upload__preview'>
          {previewUrl && <img src={previewUrl} alt='Preview' />}
          {!previewUrl && <p>Please pick an image.</p>}
        </div>
        <Button type='button' onClick={pickImageHandler}>
          PICK IMAGE
        </Button>
      </div>
      {!isValid && <p>{props.errorText}</p>}
    </div>
  );
};

export default ImageUpload;
