'use client';
import { createContext, useContext, ReactNode } from 'react';

interface TenantContextType {
  organisationId: string;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ 
  children, 
  organisationId 
}: { 
  children: ReactNode; 
  organisationId: string;
}) {
  return (
    <TenantContext.Provider value={{ organisationId }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within TenantProvider');
  }
  return context;
}
