import React, { useContext } from 'react';
import { useHistory } from 'react-router-dom';

import Input from '../../shared/components/FormElements/Input';
import Button from '../../shared/components/FormElements/Button';
import ErrorModal from '../../shared/components/UIElements/ErrorModal';
import LoadingSpinner from '../../shared/components/UIElements/LoadingSpinner';
import ImageUpload from '../../shared/components/FormElements/ImageUpload';
import {
  VALIDATOR_REQUIRE,
  VALIDATOR_MINLENGTH
} from '../../shared/util/validators';
import { useForm } from '../../shared/hooks/form-hook';
import { useHttpClient } from '../../shared/hooks/http-hook';
import { AuthContext } from '../../shared/context/auth-context';
import './PlaceForm.css';

const NewPlace = () => {
  const [formState, inputHandler] = useForm(
    {
      title: {
        // is the value of an one-line Input id
        value: '',
        isValid: false, // whether the individual input is valid
      },
      image: {
        // is the value of Input id in ImageUpload
        value: null,
        isValid: false,
      },
      description: {
        // is the value of textarea Input id
        value: '',
        isValid: false,
      },
      address: {
        // is the value of an one-line Input id
        value: '',
        isValid: false,
      },
    },
    false
  );

  const { isLoading, error, sendRequest, clearError } = useHttpClient();
  const auth = useContext(AuthContext);
  const history = useHistory();

  const placeSubmitHandler = async (event) => {
    //prevent the browser from sending the request to the backend that we haven't so far
    event.preventDefault();

    try {
      const formData = new FormData();
      formData.append('title', formState.inputs.title.value);
      formData.append('description', formState.inputs.description.value);
      formData.append('address', formState.inputs.address.value);
      // the file name 'image' must be the same as that used by middleware multer
      // in backend
      formData.append('image', formState.inputs.image.value);

      await sendRequest(
        `${process.env.REACT_APP_BACKEND_URL}/places`,
        'POST',
        formData,
        {
          Authorization: `Bearer ${auth.token}`
        });
      // Redirect the user to a different page
      history.push('/');
    } catch (err) {}
  };

  return (
    <React.Fragment>
      <ErrorModal error={error} onClear={clearError} />
      <form className='place-form' onSubmit={placeSubmitHandler}>
        {isLoading && <LoadingSpinner asOverlay />}
        <Input
          id='title'
          element='input'
          type='text'
          label='Title'
          validators={[VALIDATOR_REQUIRE()]}
          errorText='Please enter a valid title.'
          onInput={inputHandler}
        />
        {<ImageUpload center id='image' onInput={inputHandler} errorText='Please provide an image.' />}
        <Input
          id='description'
          element='textarea'
          label='Description'
          validators={[VALIDATOR_MINLENGTH(5)]}
          errorText='Please enter a valid description (at least 5 characters).'
          onInput={inputHandler}
        />
        <Input
          id='address'
          element='input'
          label='Address'
          validators={[VALIDATOR_REQUIRE()]}
          errorText='Please enter a valid address.'
          onInput={inputHandler}
        />
        <Button type='submit' disabled={!formState.isValid}>
          ADD PLACE
        </Button>
      </form>
    </React.Fragment>
  );
};

export default NewPlace;
