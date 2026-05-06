import { describe, expect, it } from 'vitest';
import { buildLandingUrlForView, getExposedSwitcherViews, getLandingPathForView, getRouteDefaultView } from './view';

describe('view landing helpers', () => {
  it('returns landing path by view', () => {
    expect(getLandingPathForView('consumer')).toBe('/marketplace');
    expect(getLandingPathForView('producer')).toBe('/dashboard');
    expect(getLandingPathForView('operator')).toBe('/dashboard');
  });

  it('builds landing url with view and keeps role override only', () => {
    expect(buildLandingUrlForView('consumer', '?role=producer_admin&foo=1')).toBe(
      '/marketplace?role=producer_admin&view=consumer'
    );
    expect(buildLandingUrlForView('producer', '?view=consumer')).toBe('/dashboard?view=producer');
  });

  it('only exposes consumer and producer in switchers', () => {
    expect(getExposedSwitcherViews(['consumer', 'producer', 'operator'])).toEqual(['consumer', 'producer']);
    expect(getExposedSwitcherViews(['producer'])).toEqual(['producer']);
  });

  it('uses consumer as marketplace route default view', () => {
    expect(getRouteDefaultView('/marketplace')).toBe('consumer');
    expect(getRouteDefaultView('/marketplace/asset/aid_001')).toBeNull();
  });
});
