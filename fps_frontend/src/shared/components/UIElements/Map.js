import React, { useRef, useEffect } from 'react';

import './Map.css';

const Map = props => {
  const mapRef = useRef();
  const { center, zoom } = props;

  useEffect(() => {
    // mapReft.current is equivalent to *mapRef in terms of C
    const map = new window.google.maps.Map(mapRef.current, {
      center: center,
      zoom: zoom
    });

    new window.google.maps.Marker({ position: center, map: map });
  }, [center, zoom]);

  // mapRef now becomes the pointer to the div element(aka node)
  return (
    <div
      ref={mapRef}
      className={`map ${props.className}`}
      style={props.style}></div>
  );
};

export default Map;
