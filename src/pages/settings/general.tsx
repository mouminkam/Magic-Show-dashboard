import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { FloppyDisk } from '@phosphor-icons/react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { FieldGrid, FieldSpan } from '@/components/ui/field';
import { NumberField, SwitchField, TextField, FormSection } from '@/components/resource/form-controls';
import { storeSettingsService, demoDataService } from '@/services/settings';
import { qk } from '@/lib/query-keys';
import { storeSettingsSchema, type StoreSettingsValues } from '@/lib/schemas';
import { errorMessage } from '@/lib/utils';

export default function GeneralSettingsPage() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: qk.storeSettings(),
    queryFn: () => storeSettingsService.get(),
  });

  const statsQuery = useQuery({
    queryKey: qk.demoStats(),
    queryFn: () => demoDataService.stats(),
  });

  const form = useForm<StoreSettingsValues>({
    resolver: zodResolver(storeSettingsSchema),
    defaultValues: {
      store_name: '',
      tagline: '',
      support_email: '',
      support_phone: '',
      default_currency: 'AED',
      tax_rate: 5,
      free_shipping_threshold: 0,
      standard_shipping_fee: 0,
      low_stock_threshold: 5,
      orders_require_confirmation: true,
      guest_checkout_enabled: true,
      reviews_require_approval: true,
      maintenance_mode: false,
      facebook_url: '',
      instagram_url: '',
      tiktok_url: '',
    },
  });

  useEffect(() => {
    if (query.data) form.reset(query.data);
  }, [query.data, form]);

  const updateMutation = useMutation({
    mutationFn: (values: StoreSettingsValues) => storeSettingsService.update(values),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.storeSettings() });
      toast.success('Store settings saved');
    },
    onError: (error) => toast.error(errorMessage(error, 'Could not save store settings')),
  });

  const onSubmit = form.handleSubmit((values) => updateMutation.mutate(values));

  return (
    <div className="animate-in-up">
      <PageHeader title="General settings" description="Store identity, checkout rules and integration toggles." />

      {query.isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      ) : (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void onSubmit(event);
          }}
          noValidate
          className="grid gap-4 lg:grid-cols-3"
        >
          <div className="space-y-4 lg:col-span-2">
            <Card>
              <CardHeader title="Store identity" />
              <CardBody className="space-y-5">
                <FormSection title="Identity">
                  <FieldGrid>
                    <TextField form={form} name="store_name" label="Store name" required />
                    <TextField form={form} name="tagline" label="Tagline" />
                    <TextField form={form} name="support_email" label="Support email" type="email" required />
                    <TextField form={form} name="support_phone" label="Support phone" />
                  </FieldGrid>
                </FormSection>

                <FormSection title="Commerce">
                  <FieldGrid>
                    <TextField form={form} name="default_currency" label="Default currency code" required />
                    <NumberField form={form} name="tax_rate" label="Tax rate" min={0} max={100} prefix="%" />
                    <NumberField form={form} name="free_shipping_threshold" label="Free shipping threshold" min={0} prefix="AED" />
                    <NumberField form={form} name="standard_shipping_fee" label="Standard shipping fee" min={0} prefix="AED" />
                    <NumberField form={form} name="low_stock_threshold" label="Low-stock threshold" min={0} step={1} />
                  </FieldGrid>
                </FormSection>

                <FormSection title="Social links">
                  <FieldGrid>
                    <TextField form={form} name="facebook_url" label="Facebook" type="url" />
                    <TextField form={form} name="instagram_url" label="Instagram" type="url" />
                    <TextField form={form} name="tiktok_url" label="TikTok" type="url" />
                  </FieldGrid>
                </FormSection>
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Checkout &amp; moderation" description="Rules applied across the storefront." />
              <CardBody>
                <FieldGrid>
                  <FieldSpan>
                    <SwitchField
                      form={form}
                      name="orders_require_confirmation"
                      label="Orders require manual confirmation"
                      description="New orders start pending until a staff member confirms them."
                    />
                  </FieldSpan>
                  <FieldSpan>
                    <SwitchField
                      form={form}
                      name="guest_checkout_enabled"
                      label="Guest checkout"
                      description="Allow purchases without creating an account."
                    />
                  </FieldSpan>
                  <FieldSpan>
                    <SwitchField
                      form={form}
                      name="reviews_require_approval"
                      label="Reviews require approval"
                      description="Hide new reviews until moderated."
                    />
                  </FieldSpan>
                  <FieldSpan>
                    <SwitchField
                      form={form}
                      name="maintenance_mode"
                      label="Maintenance mode"
                      description="Takes the storefront offline for shoppers; the admin console stays reachable."
                    />
                  </FieldSpan>
                </FieldGrid>
              </CardBody>
            </Card>

            <div className="flex justify-end">
              <Button type="submit" loading={updateMutation.isPending} icon={<FloppyDisk size={15} />}>
                Save settings
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader title="Demo dataset" description="Row counts in the current in-browser store." />
              <CardBody className="space-y-1.5">
                {statsQuery.isLoading ? (
                  <Skeleton className="h-40 w-full" />
                ) : (
                  statsQuery.data?.map((stat) => (
                    <div key={stat.label} className="flex items-center justify-between text-[13px]">
                      <span className="text-muted">{stat.label}</span>
                      <span className="tnum font-medium text-ink">{stat.count.toLocaleString('en-US')}</span>
                    </div>
                  ))
                )}
              </CardBody>
            </Card>
          </div>
        </form>
      )}
    </div>
  );
}
