export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request) {
  return new Response(
    JSON.stringify({ message: 'Hello World!' }),
    {
      status: 200,
      headers: {
        'content-type': 'application/json',
      },
    }
  );
} 