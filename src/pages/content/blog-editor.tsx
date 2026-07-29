import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { ArrowLeft, FloppyDisk } from '@phosphor-icons/react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { FieldGrid, FieldSpan } from '@/components/ui/field';
import { PageHeader } from '@/components/ui/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/states';
import {
  SelectField,
  SwitchField,
  TextField,
  TextareaField,
} from '@/components/resource/form-controls';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { adminUserHooks } from '@/hooks/resources';
import { blogPostsService } from '@/services/content';
import { qk } from '@/lib/query-keys';
import { blogPostSchema, type BlogPostValues } from '@/lib/schemas';
import { formatNumber, toDateInput } from '@/lib/format';
import { POST_STATUS_TONE } from '@/lib/status';
import { errorMessage } from '@/lib/utils';

const EMPTY: BlogPostValues = {
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  status: 'draft',
  is_featured: false,
  allow_comments: true,
  tags: '',
  meta_title: '',
  meta_description: '',
  author_id: 1,
  published_at: '',
};

export default function BlogEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isNew = id === 'new' || id === undefined;
  const postId = isNew ? null : Number(id);

  const postQuery = useQuery({
    queryKey: qk.detail('blog-posts', postId ?? 0),
    queryFn: () => blogPostsService.get(postId as number),
    enabled: postId !== null && Number.isFinite(postId),
  });

  const authorsQuery = adminUserHooks.useAll();

  const form = useForm<BlogPostValues>({
    resolver: zodResolver(blogPostSchema),
    defaultValues: EMPTY,
    mode: 'onBlur',
  });

  useEffect(() => {
    const post = postQuery.data;
    if (!post) return;
    form.reset({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      status: post.status,
      is_featured: post.is_featured,
      allow_comments: post.allow_comments,
      tags: post.tags.join(', '),
      meta_title: post.meta_title,
      meta_description: post.meta_description,
      author_id: post.author_id,
      published_at: toDateInput(post.published_at),
    });
  }, [postQuery.data, form]);

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: qk.resource('blog-posts') });
    void queryClient.invalidateQueries({ queryKey: qk.blogTags() });
  };

  const createMutation = useMutation({
    mutationFn: (values: BlogPostValues) => blogPostsService.create(values),
    onSuccess: (post) => {
      invalidate();
      toast.success('Post created');
      navigate(`/blog/${post.id}`, { replace: true });
    },
    onError: (error) => toast.error(errorMessage(error, 'Could not create that post')),
  });

  const updateMutation = useMutation({
    mutationFn: (values: BlogPostValues) => blogPostsService.update(postId as number, values),
    onSuccess: () => {
      invalidate();
      toast.success('Post saved');
    },
    onError: (error) => toast.error(errorMessage(error, 'Could not save that post')),
  });

  if (postId !== null && postQuery.isLoading) {
    return (
      <div className="animate-in-up space-y-4">
        <Skeleton className="h-9 w-72" />
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-[30rem] lg:col-span-2" />
          <Skeleton className="h-[30rem]" />
        </div>
      </div>
    );
  }

  if (postId !== null && postQuery.isError) {
    return (
      <ErrorState
        title="Post not found"
        message={errorMessage(postQuery.error)}
        onRetry={() => void postQuery.refetch()}
      />
    );
  }

  const post = postQuery.data;
  const saving = createMutation.isPending || updateMutation.isPending;
  const content = form.watch('content');
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

  return (
    <form
      className="animate-in-up"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit((values) => {
          if (postId !== null) updateMutation.mutate(values);
          else createMutation.mutate(values);
        })(event);
      }}
    >
      <div className="mb-3 md:hidden">
        <Breadcrumbs currentLabel={isNew ? 'New post' : (post?.title ?? 'Post')} />
      </div>

      <PageHeader
        title={isNew ? 'New post' : (post?.title ?? 'Edit post')}
        description={
          isNew
            ? 'Drafts stay hidden until you set the status to published.'
            : `By ${post?.author_name} · ${formatNumber(post?.view_count ?? 0)} views · ${post?.comment_count ?? 0} comments`
        }
        actions={
          <>
            <Button type="button" variant="ghost" icon={<ArrowLeft size={15} />} onClick={() => navigate('/blog')}>
              Back
            </Button>
            <Button type="submit" loading={saving} icon={<FloppyDisk size={15} />}>
              {isNew ? 'Create post' : 'Save post'}
            </Button>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader title="Content" description={`${wordCount} words`} />
            <CardBody>
              <FieldGrid>
                <FieldSpan>
                  <TextField
                    form={form}
                    name="title"
                    label="Title"
                    required
                    placeholder="How to Break In a Leather Boot Without Ruining It"
                  />
                </FieldSpan>
                <FieldSpan>
                  <TextField form={form} name="slug" label="Slug" hint="Generated from the title if blank" />
                </FieldSpan>
                <FieldSpan>
                  <TextareaField
                    form={form}
                    name="excerpt"
                    label="Excerpt"
                    rows={2}
                    hint="Shown on the journal index and in social previews."
                  />
                </FieldSpan>
                <FieldSpan>
                  <TextareaField form={form} name="content" label="Body" rows={16} required />
                </FieldSpan>
              </FieldGrid>
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

        <div className="space-y-4">
          <Card>
            <CardHeader
              title="Publishing"
              actions={
                post ? (
                  <Badge tone={POST_STATUS_TONE[post.status]} dot>
                    {post.status}
                  </Badge>
                ) : null
              }
            />
            <CardBody className="space-y-3.5">
              <SelectField
                form={form}
                name="status"
                label="Status"
                options={[
                  { value: 'draft', label: 'Draft' },
                  { value: 'scheduled', label: 'Scheduled' },
                  { value: 'published', label: 'Published' },
                  { value: 'archived', label: 'Archived' },
                ]}
              />
              <TextField form={form} name="published_at" label="Publish date" type="date" />
              <SelectField
                form={form}
                name="author_id"
                label="Author"
                options={(authorsQuery.data ?? []).map((author) => ({
                  value: String(author.id),
                  label: author.name,
                }))}
              />
              <SwitchField form={form} name="is_featured" label="Featured post" />
              <SwitchField
                form={form}
                name="allow_comments"
                label="Allow comments"
                description="Comments still need approving before they appear."
              />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Tags" />
            <CardBody>
              <TextareaField
                form={form}
                name="tags"
                label="Tags"
                rows={2}
                hint="Comma separated, e.g. care, boots, leather"
              />
            </CardBody>
          </Card>

          {post ? (
            <Card>
              <CardHeader title="Cover image" />
              <CardBody>
                <img
                  src={post.cover_image}
                  alt=""
                  className="w-full rounded-md object-cover ring-1 ring-inset ring-line"
                />
                <p className="mt-2 text-[12px] text-faint">
                  Cover artwork is generated from the title in this demo build.
                </p>
              </CardBody>
            </Card>
          ) : null}
        </div>
      </div>
    </form>
  );
}
