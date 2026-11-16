import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../lib/api';

const SettingsContext = createContext(null);

const DEFAULT_SETTINGS = {
  restaurantName: 'Zee Foods',
  tagline: 'Cravings? We’ve got you covered!',
  phone: '+92 300 1234567',
  whatsapp: '923001234567',
  email: 'hello@zeefoods.pk',
  address: 'Plot 12, Main Boulevard, Gulberg III, Lahore',
  city: 'Lahore',
  openingHours: [],
  deliveryFee: 149,
  freeDeliveryThreshold: 2500,
  minOrder: 300,
  deliveryTimeMins: 35,
  onlinePaymentEnabled: false,
  announcement: '',
  socials: {},
  chatbot: {
    enabled: true,
    welcomeMessage: "Hi, I'm Zara from Zee Foods! Ask me about our menu, deals, delivery or order tracking.",
  },
  faqs: [],
};

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    api
      .get('/settings/public')
      .then(({ data }) => {
        if (active) setSettings({ ...DEFAULT_SETTINGS, ...data.settings });
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const value = useMemo(() => ({ settings, loading }), [settings, loading]);
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used inside SettingsProvider');
  return context;
};
