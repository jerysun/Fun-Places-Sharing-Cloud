import React from 'react';

import UserItem from './UserItem';
import Card from '../../shared/components/UIElements/Card';
import './UsersList.css';

const UsersList = props => {
  if (props.items.length === 0) {
    return (
      <div className='center'>
        <Card>
          <h2>No users found.</h2>
        </Card>
      </div>
    );
  } else {
    return (
      <ul className='users-list'>
        {props.items.map(el => (
          <UserItem
            key={el.id}
            id={el.id}
            image={el.image}
            name={el.name}
            placeCount={el.places.length}
          />
        ))}
      </ul>
    );
  }
};

export default UsersList;
