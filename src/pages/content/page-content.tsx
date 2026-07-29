import { useCallback, useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import type { ColumnDef } from '@tanstack/react-table';
import { FloppyDisk, PencilSimple, TrashSimple } from '@phosphor-icons/react';
import { PageHeader, SectionHeading } from '@/components/ui/page-header';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabPanel } from '@/components/ui/tabs';
import { FieldGrid, FieldSpan } from '@/components/ui/field';
import { MenuItem } from '@/components/ui/menu';
import { NumberField, SwitchField, TextField, TextareaField } from '@/components/resource/form-controls';
import { ResourceCrudPage, type RowActionHandlers } from '@/components/resource/resource-crud-page';
import { PrimaryCell, RowActions } from '@/components/data-table/cells';
import { homeSectionHooks, aboutSectionHooks, aboutStatHooks } from '@/hooks/resources';
import { heroPagesService, contactSettingService } from '@/services/content';
import { qk } from '@/lib/query-keys';
import {
  heroPageSchema,
  type HeroPageValues,
  contactSettingSchema,
  type ContactSettingValues,
  homeSectionSchema,
  type HomeSectionValues,
  aboutSectionSchema,
  type AboutSectionValues,
  aboutStatSchema,
  type AboutStatValues,
} from '@/lib/schemas';
import { errorMessage } from '@/lib/utils';
import type { AboutSection, AboutStat, HeroPageKey, HomeSection } from '@/types/domain';

const EMPTY_HOME: HomeSectionValues = {
  section_key: '',
  title: '',
  subtitle: '',
  description: '',
  button_text: '',
  button_link: '',
  limit: 6,
  is_active: true,
  sort_order: 0,
};

const EMPTY_ABOUT_SECTION: AboutSectionValues = {
  section_key: '',
  title: '',
  subtitle: '',
  description: '',
  button_text: '',
  button_link: '',
  features: '',
  is_active: true,
};

const EMPTY_ABOUT_STAT: AboutStatValues = {
  icon: '',
  title: '',
  value: 0,
  suffix: '',
  sort_order: 0,
  is_active: true,
};

/** Hero copy shared by the shop, store and blog landing pages. */
function HeroPageForm({ page, title }: { page: HeroPageKey; title: string }) {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: [...qk.heroPages(), page], queryFn: () => heroPagesService.get(page) });

  const form = useForm<HeroPageValues>({
    resolver: zodResolver(heroPageSchema),
    defaultValues: { hero_title: '', hero_subtitle: '', hero_left_badge: '', hero_right_badge: '' },
  });

  useEffect(() => {
    if (query.data) form.reset(query.data);
  }, [query.data, form]);

  const mutation = useMutation({
    mutationFn: (values: HeroPageValues) => heroPagesService.update(page, values),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.heroPages() });
      toast.success(`${title} hero saved`);
    },
    onError: (error) => toast.error(errorMessage(error, 'Could not save that page')),
  });

  if (query.isLoading) return <Skeleton className="h-56 w-full" />;

  return (
    <Card>
      <CardHeader title={`${title} hero`} description="Copy shown at the top of the page before any products load." />
      <CardBody>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void form.handleSubmit((values) => mutation.mutate(values))(event);
          }}
          noValidate
        >
          <FieldGrid>
            <FieldSpan>
              <TextField form={form} name="hero_title" label="Hero title" required />
            </FieldSpan>
            <FieldSpan>
              <TextareaField form={form} name="hero_subtitle" label="Hero subtitle" rows={2} />
            </FieldSpan>
            <TextField form={form} name="hero_left_badge" label="Left badge" />
            <TextField form={form} name="hero_right_badge" label="Right badge" />
          </FieldGrid>
          <div className="mt-4 flex justify-end">
            <Button type="submit" loading={mutation.isPending} icon={<FloppyDisk size={15} />}>
              Save
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}

function ContactSettingForm() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: qk.contactSetting(), queryFn: () => contactSettingService.get() });

  const form = useForm<ContactSettingValues>({
    resolver: zodResolver(contactSettingSchema),
    defaultValues: {
      hero_title: '',
      hero_subtitle: '',
      details_title: '',
      address: '',
      email: '',
      phone: '',
      fax: '',
      about_title: '',
      about_text: '',
      map_url: '',
    },
  });

  useEffect(() => {
    if (query.data) form.reset(query.data);
  }, [query.data, form]);

  const mutation = useMutation({
    mutationFn: (values: ContactSettingValues) => contactSettingService.update(values),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.contactSetting() });
      toast.success('Contact page saved');
    },
    onError: (error) => toast.error(errorMessage(error, 'Could not save the contact page')),
  });

  if (query.isLoading) return <Skeleton className="h-96 w-full" />;

  return (
    <Card>
      <CardHeader title="Contact page" description="Hero copy, details and the map embed shown on /contact." />
      <CardBody>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void form.handleSubmit((values) => mutation.mutate(values))(event);
          }}
          noValidate
        >
          <FieldGrid>
            <TextField form={form} name="hero_title" label="Hero title" required />
            <TextField form={form} name="details_title" label="Details heading" />
            <FieldSpan>
              <TextareaField form={form} name="hero_subtitle" label="Hero subtitle" rows={2} />
            </FieldSpan>
            <TextField form={form} name="email" label="Email" type="email" required />
            <TextField form={form} name="phone" label="Phone" />
            <TextField form={form} name="fax" label="Fax" />
            <TextField form={form} name="map_url" label="Map embed URL" type="url" />
            <FieldSpan>
              <TextField form={form} name="address" label="Address" />
            </FieldSpan>
            <TextField form={form} name="about_title" label="About heading" />
            <FieldSpan>
              <TextareaField form={form} name="about_text" label="About text" rows={3} />
            </FieldSpan>
          </FieldGrid>
          <div className="mt-4 flex justify-end">
            <Button type="submit" loading={mutation.isPending} icon={<FloppyDisk size={15} />}>
              Save
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}

function HomeSectionsPanel() {
  const columns = useCallback(
    ({ edit, remove }: RowActionHandlers<HomeSection>): ColumnDef<HomeSection, unknown>[] => [
      {
        id: 'title',
        header: 'Section',
        meta: { sortKey: 'title', title: 'Section' },
        cell: ({ row }) => <PrimaryCell title={row.original.title} subtitle={row.original.section_key} />,
      },
      {
        id: 'limit',
        header: 'Item limit',
        meta: { title: 'Item limit', align: 'end' },
        cell: ({ row }) => <span className="tnum text-muted">{row.original.limit}</span>,
      },
      {
        id: 'is_active',
        header: 'Status',
        meta: { title: 'Status' },
        cell: ({ row }) => (
          <Badge tone={row.original.is_active ? 'positive' : 'neutral'}>
            {row.original.is_active ? 'Active' : 'Inactive'}
          </Badge>
        ),
      },
      {
        id: 'actions',
        header: '',
        meta: { locked: true, align: 'end', cellClassName: 'w-14' },
        cell: ({ row }) => (
          <RowActions>
            <MenuItem icon={<PencilSimple size={15} />} onSelect={() => edit(row.original)}>
              Edit section
            </MenuItem>
            <MenuItem icon={<TrashSimple size={15} />} destructive onSelect={() => remove(row.original)}>
              Delete
            </MenuItem>
          </RowActions>
        ),
      },
    ],
    [],
  );

  return (
    <ResourceCrudPage<HomeSection, HomeSectionValues>
      title="Home page sections"
      description="Ordered blocks rendered on the storefront home page."
      entityLabel="Section"
      hooks={homeSectionHooks}
      schema={homeSectionSchema}
      emptyValues={EMPTY_HOME}
      toFormValues={(row) => ({
        section_key: row.section_key,
        title: row.title,
        subtitle: row.subtitle,
        description: row.description,
        button_text: row.button_text,
        button_link: row.button_link,
        limit: row.limit,
        is_active: row.is_active,
        sort_order: row.sort_order,
      })}
      columns={columns}
      searchPlaceholder="Search sections…"
      defaultSort="sort_order"
      renderForm={(form) => (
        <FieldGrid>
          <TextField form={form} name="section_key" label="Section key" placeholder="featured_products" required />
          <TextField form={form} name="title" label="Title" required />
          <TextField form={form} name="subtitle" label="Subtitle" />
          <TextField form={form} name="button_text" label="Button text" />
          <TextField form={form} name="button_link" label="Button link" />
          <NumberField form={form} name="limit" label="Item limit" min={0} step={1} />
          <NumberField form={form} name="sort_order" label="Sort order" min={0} step={1} />
          <FieldSpan>
            <TextareaField form={form} name="description" label="Description" rows={2} />
          </FieldSpan>
          <FieldSpan>
            <SwitchField form={form} name="is_active" label="Active" />
          </FieldSpan>
        </FieldGrid>
      )}
    />
  );
}

function AboutSectionsPanel() {
  const columns = useCallback(
    ({ edit, remove }: RowActionHandlers<AboutSection>): ColumnDef<AboutSection, unknown>[] => [
      {
        id: 'title',
        header: 'Section',
        meta: { sortKey: 'title', title: 'Section' },
        cell: ({ row }) => <PrimaryCell title={row.original.title} subtitle={row.original.section_key} />,
      },
      {
        id: 'features',
        header: 'Features',
        meta: { title: 'Features' },
        cell: ({ row }) => <span className="text-muted">{row.original.features.length} listed</span>,
      },
      {
        id: 'is_active',
        header: 'Status',
        meta: { title: 'Status' },
        cell: ({ row }) => (
          <Badge tone={row.original.is_active ? 'positive' : 'neutral'}>
            {row.original.is_active ? 'Active' : 'Inactive'}
          </Badge>
        ),
      },
      {
        id: 'actions',
        header: '',
        meta: { locked: true, align: 'end', cellClassName: 'w-14' },
        cell: ({ row }) => (
          <RowActions>
            <MenuItem icon={<PencilSimple size={15} />} onSelect={() => edit(row.original)}>
              Edit section
            </MenuItem>
            <MenuItem icon={<TrashSimple size={15} />} destructive onSelect={() => remove(row.original)}>
              Delete
            </MenuItem>
          </RowActions>
        ),
      },
    ],
    [],
  );

  return (
    <ResourceCrudPage<AboutSection, AboutSectionValues>
      title="About page sections"
      description="Story blocks rendered on the storefront about page."
      entityLabel="Section"
      hooks={aboutSectionHooks}
      schema={aboutSectionSchema}
      emptyValues={EMPTY_ABOUT_SECTION}
      toFormValues={(row) => ({
        section_key: row.section_key,
        title: row.title,
        subtitle: row.subtitle,
        description: row.description,
        button_text: row.button_text,
        button_link: row.button_link,
        features: row.features.join('\n'),
        is_active: row.is_active,
      })}
      columns={columns}
      searchPlaceholder="Search sections…"
      defaultSort="title"
      renderForm={(form) => (
        <FieldGrid>
          <TextField form={form} name="section_key" label="Section key" required />
          <TextField form={form} name="title" label="Title" required />
          <TextField form={form} name="subtitle" label="Subtitle" />
          <TextField form={form} name="button_text" label="Button text" />
          <TextField form={form} name="button_link" label="Button link" />
          <FieldSpan>
            <TextareaField form={form} name="description" label="Description" rows={2} />
          </FieldSpan>
          <FieldSpan>
            <TextareaField form={form} name="features" label="Features (one per line)" rows={3} />
          </FieldSpan>
          <FieldSpan>
            <SwitchField form={form} name="is_active" label="Active" />
          </FieldSpan>
        </FieldGrid>
      )}
    />
  );
}

function AboutStatsPanel() {
  const columns = useCallback(
    ({ edit, remove }: RowActionHandlers<AboutStat>): ColumnDef<AboutStat, unknown>[] => [
      {
        id: 'title',
        header: 'Statistic',
        meta: { sortKey: 'title', title: 'Statistic' },
        cell: ({ row }) => <PrimaryCell title={row.original.title} subtitle={row.original.icon} />,
      },
      {
        id: 'value',
        header: 'Value',
        meta: { sortKey: 'value', align: 'end', title: 'Value' },
        cell: ({ row }) => (
          <span className="tnum text-ink">
            {row.original.value.toLocaleString('en-US')}
            {row.original.suffix}
          </span>
        ),
      },
      {
        id: 'is_active',
        header: 'Status',
        meta: { title: 'Status' },
        cell: ({ row }) => (
          <Badge tone={row.original.is_active ? 'positive' : 'neutral'}>
            {row.original.is_active ? 'Active' : 'Inactive'}
          </Badge>
        ),
      },
      {
        id: 'actions',
        header: '',
        meta: { locked: true, align: 'end', cellClassName: 'w-14' },
        cell: ({ row }) => (
          <RowActions>
            <MenuItem icon={<PencilSimple size={15} />} onSelect={() => edit(row.original)}>
              Edit statistic
            </MenuItem>
            <MenuItem icon={<TrashSimple size={15} />} destructive onSelect={() => remove(row.original)}>
              Delete
            </MenuItem>
          </RowActions>
        ),
      },
    ],
    [],
  );

  return (
    <ResourceCrudPage<AboutStat, AboutStatValues>
      title="About page statistics"
      description="Headline numbers shown in the about page counter strip."
      entityLabel="Statistic"
      hooks={aboutStatHooks}
      schema={aboutStatSchema}
      emptyValues={EMPTY_ABOUT_STAT}
      toFormValues={(row) => ({
        icon: row.icon,
        title: row.title,
        value: row.value,
        suffix: row.suffix,
        sort_order: row.sort_order,
        is_active: row.is_active,
      })}
      columns={columns}
      searchPlaceholder="Search statistics…"
      defaultSort="sort_order"
      renderForm={(form) => (
        <FieldGrid>
          <TextField form={form} name="icon" label="Icon name" placeholder="Trophy" required />
          <TextField form={form} name="title" label="Label" required />
          <NumberField form={form} name="value" label="Value" step={1} />
          <TextField form={form} name="suffix" label="Suffix" placeholder="+" />
          <NumberField form={form} name="sort_order" label="Sort order" min={0} step={1} />
          <FieldSpan>
            <SwitchField form={form} name="is_active" label="Active" />
          </FieldSpan>
        </FieldGrid>
      )}
    />
  );
}

const TABS = [
  { value: 'home', label: 'Home' },
  { value: 'shop', label: 'Shop' },
  { value: 'store', label: 'Store' },
  { value: 'blog', label: 'Blog' },
  { value: 'about', label: 'About' },
  { value: 'contact', label: 'Contact' },
];

export default function PageContentPage() {
  const [tab, setTab] = useState('home');

  return (
    <div className="animate-in-up">
      <PageHeader title="Page content" description="Copy and layout controls for the storefront's marketing pages." />

      <Tabs value={tab} onValueChange={setTab} tabs={TABS}>
        <TabPanel value="home" className="pt-4">
          <HomeSectionsPanel />
        </TabPanel>
        <TabPanel value="shop" className="pt-4">
          <HeroPageForm page="shop" title="Shop" />
        </TabPanel>
        <TabPanel value="store" className="pt-4">
          <HeroPageForm page="store" title="Store" />
        </TabPanel>
        <TabPanel value="blog" className="pt-4">
          <HeroPageForm page="blog" title="Blog" />
        </TabPanel>
        <TabPanel value="about" className="space-y-4 pt-4">
          <SectionHeading title="Sections" description="Story blocks, manage below." />
          <AboutSectionsPanel />
          <SectionHeading title="Statistics" description="Counter strip numbers." />
          <AboutStatsPanel />
        </TabPanel>
        <TabPanel value="contact" className="pt-4">
          <ContactSettingForm />
        </TabPanel>
      </Tabs>
    </div>
  );
}
