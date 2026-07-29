import { useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, FloppyDisk, Plus, TrashSimple } from '@phosphor-icons/react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { Field, FieldGrid, FieldSpan, Input } from '@/components/ui/field';
import { PageHeader } from '@/components/ui/page-header';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/states';
import {
  NumberField,
  SelectField,
  SwitchField,
  TextField,
  TextareaField,
} from '@/components/resource/form-controls';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import {
  attributeHooks,
  brandHooks,
  categoryHooks,
  colorHooks,
  materialHooks,
  productHooks,
  seasonHooks,
  sizeHooks,
} from '@/hooks/resources';
import { productsService } from '@/services/catalog';
import { qk } from '@/lib/query-keys';
import { productSchema, type ProductValues } from '@/lib/schemas';
import { formatMoney } from '@/lib/format';
import { cn, errorMessage } from '@/lib/utils';

const EMPTY: ProductValues = {
  name: '',
  slug: '',
  sku: '',
  brand_id: null,
  category_id: null,
  material_id: null,
  season_id: null,
  short_description: '',
  description: '',
  price: 0,
  sale_price: null,
  compare_price: null,
  cost_price: 0,
  min_quantity: 5,
  weight: 0,
  barcode: '',
  model: '',
  color_ids: [],
  size_ids: [],
  variants: [],
  attributes: {},
  is_active: true,
  is_featured: false,
  requires_shipping: true,
  track_quantity: true,
  allow_backorder: false,
  meta_title: '',
  meta_description: '',
  sort_order: 0,
};

/** Multi-select rendered as toggle chips — faster than a listbox for 10-16 items. */
function ChipGroup({
  options,
  value,
  onChange,
  renderSwatch,
}: {
  options: { id: number; label: string; hex?: string }[];
  value: number[];
  onChange: (next: number[]) => void;
  renderSwatch?: boolean;
}) {
  if (options.length === 0) {
    return <p className="text-[12.5px] text-faint">Nothing available yet.</p>;
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((option) => {
        const selected = value.includes(option.id);
        return (
          <button
            key={option.id}
            type="button"
            aria-pressed={selected}
            onClick={() =>
              onChange(selected ? value.filter((id) => id !== option.id) : [...value, option.id])
            }
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12.5px] transition-colors',
              selected
                ? 'border-brand bg-brand-soft font-medium text-brand'
                : 'border-line bg-surface text-muted hover:border-line-strong hover:text-ink',
            )}
          >
            {renderSwatch && option.hex ? (
              <span
                className="h-3 w-3 rounded-full ring-1 ring-inset ring-black/10"
                style={{ backgroundColor: option.hex }}
                aria-hidden
              />
            ) : null}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export default function ProductEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = id === 'new' || id === undefined;
  const productId = isNew ? null : Number(id);

  const productQuery = useQuery({
    queryKey: qk.detail('products', productId ?? 0),
    queryFn: () => productsService.get(productId as number),
    enabled: productId !== null && Number.isFinite(productId),
  });

  const categoriesQuery = categoryHooks.useAll();
  const brandsQuery = brandHooks.useAll();
  const materialsQuery = materialHooks.useAll();
  const seasonsQuery = seasonHooks.useAll();
  const colorsQuery = colorHooks.useAll();
  const sizesQuery = sizeHooks.useAll();
  const attributesQuery = attributeHooks.useAll();

  const createMutation = productHooks.useCreate();
  const updateMutation = productHooks.useUpdate();

  const form = useForm<ProductValues>({
    resolver: zodResolver(productSchema),
    defaultValues: EMPTY,
    mode: 'onBlur',
  });

  const variants = useFieldArray({ control: form.control, name: 'variants' });

  useEffect(() => {
    const product = productQuery.data;
    if (!product) return;
    form.reset({
      name: product.name,
      slug: product.slug,
      sku: product.sku,
      brand_id: product.brand_id,
      category_id: product.category_id,
      material_id: product.material_id,
      season_id: product.season_id,
      short_description: product.short_description,
      description: product.description,
      price: product.price,
      sale_price: product.sale_price,
      compare_price: product.compare_price,
      cost_price: product.cost_price,
      min_quantity: product.min_quantity,
      weight: product.weight,
      barcode: product.barcode,
      model: product.model,
      color_ids: product.color_ids,
      size_ids: product.size_ids,
      variants: product.variants.map((variant) => ({
        id: variant.id,
        sku: variant.sku,
        color_id: variant.color_id,
        size_id: variant.size_id,
        price_delta: variant.price_delta,
        quantity: variant.quantity,
        barcode: variant.barcode,
      })),
      attributes: product.attributes,
      is_active: product.is_active,
      is_featured: product.is_featured,
      requires_shipping: product.requires_shipping,
      track_quantity: product.track_quantity,
      allow_backorder: product.allow_backorder,
      meta_title: product.meta_title,
      meta_description: product.meta_description,
      sort_order: product.sort_order,
    });
  }, [productQuery.data, form]);

  const colorOptions = useMemo(
    () =>
      (colorsQuery.data ?? []).map((color) => ({
        id: color.id,
        label: color.name,
        hex: color.hex_code,
      })),
    [colorsQuery.data],
  );
  const sizeOptions = useMemo(
    () => (sizesQuery.data ?? []).map((size) => ({ id: size.id, label: size.name })),
    [sizesQuery.data],
  );

  const colorSelectOptions = useMemo(
    () => [
      { value: '', label: 'No colour' },
      ...(colorsQuery.data ?? []).map((color) => ({ value: String(color.id), label: color.name })),
    ],
    [colorsQuery.data],
  );
  const sizeSelectOptions = useMemo(
    () => [
      { value: '', label: 'One size' },
      ...(sizesQuery.data ?? []).map((size) => ({ value: String(size.id), label: size.name })),
    ],
    [sizesQuery.data],
  );

  const price = form.watch('price');
  const costPrice = form.watch('cost_price');
  const salePrice = form.watch('sale_price');
  const effectivePrice = Number(salePrice ?? price) || 0;
  const margin =
    effectivePrice > 0 ? ((effectivePrice - Number(costPrice || 0)) / effectivePrice) * 100 : 0;

  const saving = createMutation.isPending || updateMutation.isPending;

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      if (productId !== null) {
        await updateMutation.mutateAsync({ id: productId, input: values });
      } else {
        const created = await createMutation.mutateAsync(values);
        navigate(`/products/${created.id}`, { replace: true });
      }
    } catch {
      // Toast already raised by the mutation hook; stay on the form.
    }
  });

  if (productId !== null && productQuery.isLoading) {
    return (
      <div className="animate-in-up space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-[28rem] lg:col-span-2" />
          <Skeleton className="h-[28rem]" />
        </div>
      </div>
    );
  }

  if (productId !== null && productQuery.isError) {
    return (
      <div className="animate-in-up">
        <ErrorState
          title="Product not found"
          message={errorMessage(productQuery.error)}
          onRetry={() => void productQuery.refetch()}
        />
      </div>
    );
  }

  const product = productQuery.data;

  return (
    <form
      className="animate-in-up"
      onSubmit={(event) => {
        event.preventDefault();
        void onSubmit(event);
      }}
      noValidate
    >
      <div className="mb-3 md:hidden">
        <Breadcrumbs currentLabel={isNew ? 'New product' : (product?.name ?? 'Product')} />
      </div>

      <PageHeader
        title={isNew ? 'New product' : (product?.name ?? 'Edit product')}
        description={
          isNew
            ? 'Create a catalogue entry. Variants drive the stock figure shown on the storefront.'
            : `SKU ${product?.sku} · ${product?.category_name} · ${product?.brand_name}`
        }
        actions={
          <>
            <Button
              type="button"
              variant="ghost"
              icon={<ArrowLeft size={15} />}
              onClick={() => navigate('/products')}
            >
              Back
            </Button>
            <Button type="submit" loading={saving} icon={<FloppyDisk size={15} />}>
              {isNew ? 'Create product' : 'Save changes'}
            </Button>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {/* ------------------------------------------------------ main column */}
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader title="Basics" description="What the product is called and how it is identified." />
            <CardBody>
              <FieldGrid>
                <FieldSpan>
                  <TextField
                    form={form}
                    name="name"
                    label="Product name"
                    required
                    placeholder="Meridian Low Sneaker"
                  />
                </FieldSpan>
                <TextField form={form} name="sku" label="SKU" required placeholder="MS-SN-1007" />
                <TextField form={form} name="slug" label="Slug" hint="Generated from the name if blank" />
                <TextField form={form} name="model" label="Model code" placeholder="MERIDIAN-2026" />
                <TextField form={form} name="barcode" label="Barcode" placeholder="6212345678901" />
                <FieldSpan>
                  <TextareaField
                    form={form}
                    name="short_description"
                    label="Short description"
                    rows={2}
                    hint="Shown on category tiles. Max 220 characters."
                  />
                </FieldSpan>
                <FieldSpan>
                  <TextareaField
                    form={form}
                    name="description"
                    label="Full description"
                    rows={6}
                    placeholder="Construction, materials, fit notes…"
                  />
                </FieldSpan>
              </FieldGrid>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Pricing"
              description="All figures are in AED, the store's base currency."
              actions={
                effectivePrice > 0 ? (
                  <Badge tone={margin >= 40 ? 'positive' : margin >= 20 ? 'caution' : 'critical'}>
                    {margin.toFixed(0)}% margin
                  </Badge>
                ) : null
              }
            />
            <CardBody>
              <FieldGrid>
                <NumberField form={form} name="price" label="Regular price" required min={0} prefix="AED" />
                <NumberField
                  form={form}
                  name="sale_price"
                  label="Sale price"
                  min={0}
                  prefix="AED"
                  hint="Leave blank when the product is not on offer"
                />
                <NumberField
                  form={form}
                  name="compare_price"
                  label="Compare-at price"
                  min={0}
                  prefix="AED"
                  hint="Shown struck through next to the sale price"
                />
                <NumberField form={form} name="cost_price" label="Cost price" min={0} prefix="AED" />
              </FieldGrid>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Variants"
              description="Each colour/size combination the warehouse picks against."
              actions={
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  icon={<Plus size={14} />}
                  onClick={() =>
                    variants.append({
                      sku: `${form.getValues('sku') || 'SKU'}-${String(variants.fields.length + 1).padStart(2, '0')}`,
                      color_id: null,
                      size_id: null,
                      price_delta: 0,
                      quantity: 0,
                      barcode: '',
                    })
                  }
                >
                  Add variant
                </Button>
              }
            />
            <CardBody>
              {variants.fields.length === 0 ? (
                <p className="rounded-md border border-dashed border-line px-4 py-8 text-center text-[13px] text-muted">
                  No variants yet. Products without variants use the stock figure from the inventory screens.
                </p>
              ) : (
                <div className="space-y-2">
                  {variants.fields.map((field, index) => (
                    <div
                      key={field.id}
                      className="grid grid-cols-2 items-end gap-2 rounded-md border border-line bg-sunken/40 p-2.5 md:grid-cols-[1.4fr_1fr_1fr_0.8fr_0.8fr_auto]"
                    >
                      <Field label={index === 0 ? 'Variant SKU' : ''}>
                        {(props) => (
                          <Input
                            {...props}
                            {...form.register(`variants.${index}.sku` as const)}
                            placeholder="MS-SN-1007-01"
                          />
                        )}
                      </Field>
                      <Field label={index === 0 ? 'Colour' : ''}>
                        {(props) => (
                          <Controller
                            control={form.control}
                            name={`variants.${index}.color_id` as const}
                            render={({ field: controlled }) => (
                              <Select
                                {...props}
                                value={controlled.value === null ? '' : String(controlled.value)}
                                onValueChange={controlled.onChange}
                                options={colorSelectOptions}
                              />
                            )}
                          />
                        )}
                      </Field>
                      <Field label={index === 0 ? 'Size' : ''}>
                        {(props) => (
                          <Controller
                            control={form.control}
                            name={`variants.${index}.size_id` as const}
                            render={({ field: controlled }) => (
                              <Select
                                {...props}
                                value={controlled.value === null ? '' : String(controlled.value)}
                                onValueChange={controlled.onChange}
                                options={sizeSelectOptions}
                              />
                            )}
                          />
                        )}
                      </Field>
                      <Field label={index === 0 ? 'Qty' : ''}>
                        {(props) => (
                          <Input
                            {...props}
                            type="number"
                            min={0}
                            {...form.register(`variants.${index}.quantity` as const)}
                          />
                        )}
                      </Field>
                      <Field label={index === 0 ? '+/− price' : ''}>
                        {(props) => (
                          <Input
                            {...props}
                            type="number"
                            {...form.register(`variants.${index}.price_delta` as const)}
                          />
                        )}
                      </Field>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={`Remove variant ${index + 1}`}
                        onClick={() => variants.remove(index)}
                      >
                        <TrashSimple size={15} className="text-critical" aria-hidden />
                      </Button>
                    </div>
                  ))}
                  <p className="pt-1 text-[12.5px] text-muted tnum">
                    Total stock across variants:{' '}
                    <span className="font-medium text-ink">
                      {form
                        .watch('variants')
                        .reduce((sum, variant) => sum + (Number(variant.quantity) || 0), 0)}
                    </span>{' '}
                    units
                  </p>
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Options" description="Colours and sizes offered for this style." />
            <CardBody className="space-y-4">
              <div>
                <p className="mb-2 eyebrow">Colours</p>
                <Controller
                  control={form.control}
                  name="color_ids"
                  render={({ field }) => (
                    <ChipGroup
                      options={colorOptions}
                      value={field.value}
                      onChange={field.onChange}
                      renderSwatch
                    />
                  )}
                />
              </div>
              <div>
                <p className="mb-2 eyebrow">Sizes</p>
                <Controller
                  control={form.control}
                  name="size_ids"
                  render={({ field }) => (
                    <ChipGroup options={sizeOptions} value={field.value} onChange={field.onChange} />
                  )}
                />
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Attributes"
              description="Merchandising fields shared across the catalogue."
            />
            <CardBody>
              <Controller
                control={form.control}
                name="attributes"
                render={({ field }) => (
                  <FieldGrid>
                    {(attributesQuery.data ?? [])
                      .filter((attribute) => attribute.is_visible)
                      .map((attribute) => (
                        <Field key={attribute.id} label={attribute.name} required={attribute.is_required}>
                          {(props) =>
                            attribute.type === 'select' && attribute.options.length ? (
                              <Select
                                {...props}
                                value={field.value[attribute.slug] ?? ''}
                                onValueChange={(value) =>
                                  field.onChange({ ...field.value, [attribute.slug]: value })
                                }
                                options={[
                                  { value: '', label: 'Not set' },
                                  ...attribute.options.map((option) => ({
                                    value: option,
                                    label: option,
                                  })),
                                ]}
                              />
                            ) : (
                              <Input
                                {...props}
                                value={field.value[attribute.slug] ?? ''}
                                onChange={(event) =>
                                  field.onChange({ ...field.value, [attribute.slug]: event.target.value })
                                }
                                placeholder={attribute.type === 'number' ? '0' : 'Not set'}
                              />
                            )
                          }
                        </Field>
                      ))}
                  </FieldGrid>
                )}
              />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Search engine listing" />
            <CardBody>
              <FieldGrid>
                <FieldSpan>
                  <TextField form={form} name="meta_title" label="Meta title" />
                </FieldSpan>
                <FieldSpan>
                  <TextareaField form={form} name="meta_description" label="Meta description" rows={2} />
                </FieldSpan>
              </FieldGrid>
            </CardBody>
          </Card>
        </div>

        {/* ------------------------------------------------------ side column */}
        <div className="space-y-4">
          <Card>
            <CardHeader title="Visibility" />
            <CardBody className="space-y-2.5">
              <SwitchField
                form={form}
                name="is_active"
                label="Published"
                description="Draft products stay hidden from the storefront."
              />
              <SwitchField form={form} name="is_featured" label="Featured" />
              <SwitchField form={form} name="requires_shipping" label="Requires shipping" />
              <SwitchField form={form} name="track_quantity" label="Track stock" />
              <SwitchField
                form={form}
                name="allow_backorder"
                label="Allow backorder"
                description="Let customers buy when the stock figure hits zero."
              />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Organisation" />
            <CardBody>
              <div className="space-y-3.5">
                <SelectField
                  form={form}
                  name="category_id"
                  label="Category"
                  placeholder="Uncategorised"
                  options={[
                    { value: '', label: 'Uncategorised' },
                    ...(categoriesQuery.data ?? []).map((category) => ({
                      value: String(category.id),
                      label: category.name,
                    })),
                  ]}
                />
                <SelectField
                  form={form}
                  name="brand_id"
                  label="Brand"
                  placeholder="No brand"
                  options={[
                    { value: '', label: 'No brand' },
                    ...(brandsQuery.data ?? []).map((brand) => ({
                      value: String(brand.id),
                      label: brand.name,
                    })),
                  ]}
                />
                <SelectField
                  form={form}
                  name="material_id"
                  label="Primary material"
                  placeholder="Not specified"
                  options={[
                    { value: '', label: 'Not specified' },
                    ...(materialsQuery.data ?? []).map((material) => ({
                      value: String(material.id),
                      label: material.name,
                    })),
                  ]}
                />
                <SelectField
                  form={form}
                  name="season_id"
                  label="Season"
                  placeholder="All season"
                  options={[
                    { value: '', label: 'All season' },
                    ...(seasonsQuery.data ?? []).map((season) => ({
                      value: String(season.id),
                      label: season.name,
                    })),
                  ]}
                />
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Logistics" />
            <CardBody>
              <FieldGrid>
                <NumberField form={form} name="weight" label="Weight (kg)" min={0} step={0.01} />
                <NumberField form={form} name="min_quantity" label="Low-stock at" min={0} step={1} />
                <FieldSpan>
                  <NumberField form={form} name="sort_order" label="Sort order" min={0} step={1} />
                </FieldSpan>
              </FieldGrid>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Media"
              description={
                isNew
                  ? 'Artwork is generated for new products in this demo build.'
                  : 'Gallery shots shown on the product page.'
              }
            />
            <CardBody>
              {product && product.images.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {product.images.map((image) => (
                    <figure key={image.id} className="relative">
                      <img
                        src={image.url}
                        alt={image.alt_text}
                        className="aspect-square w-full rounded-md object-cover ring-1 ring-inset ring-line"
                      />
                      {image.is_primary ? (
                        <figcaption className="absolute bottom-1 left-1">
                          <Badge tone="brand">Primary</Badge>
                        </figcaption>
                      ) : null}
                    </figure>
                  ))}
                </div>
              ) : (
                <p className="rounded-md border border-dashed border-line px-4 py-8 text-center text-[13px] text-muted">
                  Images are generated from the product name once it is saved.
                </p>
              )}
            </CardBody>
          </Card>

          {product ? (
            <Card>
              <CardHeader title="Performance" />
              <CardBody>
                <dl className="space-y-2 text-[13px]">
                  <div className="flex items-center justify-between">
                    <dt className="text-muted">Units sold</dt>
                    <dd className="font-medium text-ink tnum">{product.units_sold}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-muted">Reviews</dt>
                    <dd className="font-medium text-ink tnum">{product.review_count}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-muted">Average rating</dt>
                    <dd className="font-medium text-ink tnum">
                      {product.review_count ? product.rating.toFixed(1) : '—'}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-muted">Stock on hand</dt>
                    <dd className="font-medium text-ink tnum">{product.quantity}</dd>
                  </div>
                  <div className="flex items-center justify-between border-t border-line pt-2">
                    <dt className="text-muted">Lifetime revenue</dt>
                    <dd className="font-medium text-ink tnum">
                      {formatMoney(product.units_sold * (product.sale_price ?? product.price))}
                    </dd>
                  </div>
                </dl>
              </CardBody>
            </Card>
          ) : null}
        </div>
      </div>
    </form>
  );
}
