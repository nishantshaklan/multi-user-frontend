import axios from 'axios';
import { fetchCustomerPlans } from '../../src/api/planApi';

jest.mock('axios');

describe('fetchCustomerPlans', () => {
  beforeEach(() => {
    axios.get.mockReset();
  });

  it('throws when enterpriseId is missing', async () => {
    await expect(fetchCustomerPlans({ token: 't' })).rejects.toMatchObject({
      message: 'enterpriseId is required',
      code: 'MISSING_ENTERPRISE_ID',
    });
  });

  it('fetches plans with bearer token', async () => {
    axios.get.mockResolvedValue({ data: { plan_subs: [] } });
    const data = await fetchCustomerPlans({ enterpriseId: 'ent-1', token: 'abc' });
    expect(data).toEqual({ plan_subs: [] });
    expect(axios.get).toHaveBeenCalledWith(
      expect.stringContaining('/customers/ent-1/subscriptions/plans'),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer abc' }),
      }),
    );
  });

  it('returns empty object when response data is missing', async () => {
    axios.get.mockResolvedValue({});
    await expect(fetchCustomerPlans({ enterpriseId: 'ent-1' })).resolves.toEqual({});
  });
});
