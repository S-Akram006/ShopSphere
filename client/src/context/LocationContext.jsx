import React, { createContext, useContext, useState, useEffect } from 'react';

const LocationContext = createContext(null);

export const POPULAR_LOCATIONS = [
  { city: 'New York', state: 'NY', zip: '10001', zone: 'East Coast', label: 'New York, NY (10001)' },
  { city: 'Los Angeles', state: 'CA', zip: '90001', zone: 'West Coast', label: 'Los Angeles, CA (90001)' },
  { city: 'Chicago', state: 'IL', zip: '60601', zone: 'Midwest', label: 'Chicago, IL (60601)' },
  { city: 'Austin', state: 'TX', zip: '78701', zone: 'South', label: 'Austin, TX (78701)' },
  { city: 'Miami', state: 'FL', zip: '33101', zone: 'East Coast', label: 'Miami, FL (33101)' },
  { city: 'Seattle', state: 'WA', zip: '98101', zone: 'West Coast', label: 'Seattle, WA (98101)' },
];

export const LocationProvider = ({ children }) => {
  const [customerLocation, setCustomerLocation] = useState(() => {
    const saved = localStorage.getItem('shopsphere_customer_location');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return POPULAR_LOCATIONS[0];
  });

  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (customerLocation) {
      localStorage.setItem('shopsphere_customer_location', JSON.stringify(customerLocation));
    }
  }, [customerLocation]);

  const updateLocation = (newLoc) => {
    setCustomerLocation(newLoc);
    setIsModalOpen(false);
  };

  // Check if a product can deliver to the customer's active location
  const canDeliverTo = (product, location = customerLocation) => {
    if (!product) return true;
    const zones = product.deliveryZones || ['Nationwide'];
    if (zones.includes('Nationwide')) return true;
    if (location?.zone && zones.includes(location.zone)) return true;
    if (location?.city && zones.some((z) => z.toLowerCase().includes(location.city.toLowerCase()))) return true;
    if (location?.state && zones.some((z) => z.toLowerCase().includes(location.state.toLowerCase()))) return true;
    return false;
  };

  // Calculate estimated delivery date
  const getDeliveryETA = (product) => {
    const days = product?.estimatedDeliveryDays || 3;
    const target = new Date();
    target.setDate(target.getDate() + days);
    return target.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return (
    <LocationContext.Provider
      value={{
        customerLocation,
        updateLocation,
        isModalOpen,
        setIsModalOpen,
        canDeliverTo,
        getDeliveryETA,
        popularLocations: POPULAR_LOCATIONS,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => useContext(LocationContext);
