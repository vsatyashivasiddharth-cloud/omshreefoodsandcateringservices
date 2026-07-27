export async function searchProducts(query: string) {
  console.log("Searching for:", query);

  const response = await fetch(
    `/api/search?q=${encodeURIComponent(query)}`
  );

  console.log("Response Status:", response.status);

  const data = await response.json();

  console.log("API Response:", data);

  if (!response.ok) {
    throw new Error(data.error || "Failed to search products");
  }

  return data;
}