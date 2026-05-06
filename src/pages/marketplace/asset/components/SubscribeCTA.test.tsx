import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { buildAssetId } from '../../../../lib/runtimeTokens';
import { SubscribeCTA } from './SubscribeCTA';
import { useAssetDetailShortlistStore } from '../stores/shortlistStore';

const TEST_ASSET_ID = buildAssetId(1);

describe('SubscribeCTA', () => {
  beforeEach(() => {
    useAssetDetailShortlistStore.getState().reset();
  });

  it('adds asset into shortlist', () => {
    render(
      <SubscribeCTA
        assetId={TEST_ASSET_ID}
        data={{
          title: '先试算，再订阅',
          subtitle: 'subtitle',
          primaryAction: '立即试算',
          secondaryAction: '加入待选',
        }}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /加入待选/i }));
    expect(useAssetDetailShortlistStore.getState().assetIds).toContain(TEST_ASSET_ID);
    expect(screen.getByText(/已加入待选/i)).toBeInTheDocument();
  });
});
