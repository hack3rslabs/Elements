import Head from "next/head";

interface AdminSeoHeadProps {
  title?: string;
  description?: string;
}

export default function AdminSeoHead({ title, description }: AdminSeoHeadProps) {
  return (
    <Head>
      {title && <title>{title}</title>}
      {description && <meta name="description" content={description} />}
    </Head>
  );
}
