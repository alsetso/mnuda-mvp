export default function SimplePage() {
  return (
    <html>
      <head>
        <title>MNUDA Simple Test</title>
      </head>
      <body>
        <h1>MNUDA Simple Test Page</h1>
        <p>This is a basic HTML page to test routing.</p>
        <p>Time: {new Date().toISOString()}</p>
      </body>
    </html>
  );
}
