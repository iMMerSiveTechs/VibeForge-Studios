export interface Template {
  id: string;
  name: string;
  description: string;
  icon: string;
  files: Record<string, string>;
}

export const TEMPLATES: Template[] = [
  {
    id: "todo",
    name: "Todo App",
    description: "A simple todo list with add, delete, and complete",
    icon: "\u2705",
    files: {
      "preview.html": `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Todo App</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, sans-serif; background: #f5f5f5; padding: 20px; }
  .container { max-width: 400px; margin: 0 auto; }
  h1 { text-align: center; margin-bottom: 20px; color: #333; }
  .input-row { display: flex; gap: 8px; margin-bottom: 16px; }
  input { flex: 1; padding: 10px; border: 1px solid #ddd; border-radius: 8px; font-size: 16px; }
  button { padding: 10px 16px; background: #007AFF; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; }
  .todo-item { display: flex; align-items: center; gap: 8px; padding: 12px; background: white; border-radius: 8px; margin-bottom: 8px; }
  .todo-item.done span { text-decoration: line-through; color: #999; }
  .todo-item span { flex: 1; }
  .delete-btn { background: #FF3B30; padding: 6px 10px; font-size: 14px; }
</style>
</head>
<body>
<div class="container">
  <h1>Todo App</h1>
  <div class="input-row">
    <input id="inp" placeholder="Add a task..." />
    <button onclick="addTodo()">Add</button>
  </div>
  <div id="list"></div>
</div>
<script>
  let todos = [];
  function render() {
    const list = document.getElementById("list");
    list.innerHTML = todos.map((t, i) =>
      \`<div class="todo-item \${t.done ? "done" : ""}">
        <input type="checkbox" \${t.done ? "checked" : ""} onchange="toggle(\${i})" />
        <span>\${t.text}</span>
        <button class="delete-btn" onclick="remove(\${i})">X</button>
      </div>\`
    ).join("");
  }
  function addTodo() {
    const inp = document.getElementById("inp");
    if (inp.value.trim()) { todos.push({ text: inp.value.trim(), done: false }); inp.value = ""; render(); }
  }
  function toggle(i) { todos[i].done = !todos[i].done; render(); }
  function remove(i) { todos.splice(i, 1); render(); }
  document.getElementById("inp").addEventListener("keydown", e => { if (e.key === "Enter") addTodo(); });
  render();
</script>
</body>
</html>`,
      "app/index.tsx": `import React, { useState } from "react";
import { View, StyleSheet, FlatList } from "react-native";
import { TodoInput } from "../components/TodoInput";
import { TodoItem } from "../components/TodoItem";

interface Todo {
  id: string;
  text: string;
  done: boolean;
}

export default function TodoScreen() {
  const [todos, setTodos] = useState<Todo[]>([]);

  const addTodo = (text: string) => {
    setTodos((prev) => [
      ...prev,
      { id: Date.now().toString(), text, done: false },
    ]);
  };

  const toggleTodo = (id: string) => {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  };

  const deleteTodo = (id: string) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <View style={styles.container}>
      <TodoInput onAdd={addTodo} />
      <FlatList
        data={todos}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TodoItem
            todo={item}
            onToggle={() => toggleTodo(item.id)}
            onDelete={() => deleteTodo(item.id)}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#f5f5f5" },
});`,
      "components/TodoInput.tsx": `import React, { useState } from "react";
import { View, TextInput, TouchableOpacity, Text, StyleSheet } from "react-native";

interface Props {
  onAdd: (text: string) => void;
}

export function TodoInput({ onAdd }: Props) {
  const [text, setText] = useState("");

  const handleAdd = () => {
    if (text.trim()) {
      onAdd(text.trim());
      setText("");
    }
  };

  return (
    <View style={styles.row}>
      <TextInput
        style={styles.input}
        value={text}
        onChangeText={setText}
        placeholder="Add a task..."
        onSubmitEditing={handleAdd}
      />
      <TouchableOpacity style={styles.button} onPress={handleAdd}>
        <Text style={styles.buttonText}>Add</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 8, marginBottom: 16 },
  input: { flex: 1, padding: 10, backgroundColor: "#fff", borderRadius: 8, fontSize: 16 },
  button: { padding: 10, backgroundColor: "#007AFF", borderRadius: 8, justifyContent: "center" },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});`,
      "components/TodoItem.tsx": `import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

interface Props {
  todo: { id: string; text: string; done: boolean };
  onToggle: () => void;
  onDelete: () => void;
}

export function TodoItem({ todo, onToggle, onDelete }: Props) {
  return (
    <View style={styles.item}>
      <TouchableOpacity onPress={onToggle} style={styles.checkbox}>
        <Text>{todo.done ? "\u2611" : "\u2610"}</Text>
      </TouchableOpacity>
      <Text style={[styles.text, todo.done && styles.doneText]}>{todo.text}</Text>
      <TouchableOpacity onPress={onDelete} style={styles.deleteBtn}>
        <Text style={styles.deleteText}>X</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  item: { flexDirection: "row", alignItems: "center", padding: 12, backgroundColor: "#fff", borderRadius: 8, marginBottom: 8 },
  checkbox: { marginRight: 8 },
  text: { flex: 1, fontSize: 16 },
  doneText: { textDecorationLine: "line-through", color: "#999" },
  deleteBtn: { backgroundColor: "#FF3B30", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  deleteText: { color: "#fff", fontWeight: "600" },
});`,
    },
  },
  {
    id: "weather",
    name: "Weather App",
    description: "Weather display with city search",
    icon: "\u26C5",
    files: {
      "preview.html": `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Weather App</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, sans-serif; background: linear-gradient(135deg, #667eea, #764ba2); min-height: 100vh; display: flex; align-items: center; justify-content: center; }
  .card { background: rgba(255,255,255,0.95); border-radius: 16px; padding: 32px; width: 340px; text-align: center; }
  .search { display: flex; gap: 8px; margin-bottom: 24px; }
  .search input { flex: 1; padding: 10px; border: 1px solid #ddd; border-radius: 8px; font-size: 16px; }
  .search button { padding: 10px 16px; background: #667eea; color: white; border: none; border-radius: 8px; cursor: pointer; }
  .icon { font-size: 64px; margin: 16px 0; }
  .temp { font-size: 48px; font-weight: bold; color: #333; }
  .city { font-size: 20px; color: #666; margin-top: 8px; }
  .details { display: flex; justify-content: space-around; margin-top: 24px; padding-top: 16px; border-top: 1px solid #eee; }
  .detail-item { text-align: center; }
  .detail-label { font-size: 12px; color: #999; }
  .detail-value { font-size: 16px; font-weight: 600; color: #333; }
</style>
</head>
<body>
<div class="card">
  <div class="search">
    <input id="city" placeholder="Search city..." value="San Francisco" />
    <button onclick="search()">Go</button>
  </div>
  <div class="icon" id="icon">\u2600\uFE0F</div>
  <div class="temp" id="temp">72\u00B0F</div>
  <div class="city" id="name">San Francisco</div>
  <div class="details">
    <div class="detail-item"><div class="detail-label">Humidity</div><div class="detail-value" id="hum">65%</div></div>
    <div class="detail-item"><div class="detail-label">Wind</div><div class="detail-value" id="wind">12 mph</div></div>
    <div class="detail-item"><div class="detail-label">Condition</div><div class="detail-value" id="cond">Sunny</div></div>
  </div>
</div>
<script>
  const mock = {
    "San Francisco": { icon: "\u2600\uFE0F", temp: 72, hum: 65, wind: 12, cond: "Sunny" },
    "New York": { icon: "\u26C5", temp: 58, hum: 78, wind: 18, cond: "Cloudy" },
    "London": { icon: "\uD83C\uDF27\uFE0F", temp: 50, hum: 85, wind: 15, cond: "Rainy" },
    "Tokyo": { icon: "\uD83C\uDF24\uFE0F", temp: 68, hum: 55, wind: 8, cond: "Clear" },
  };
  function search() {
    const city = document.getElementById("city").value;
    const data = mock[city] || { icon: "\u2753", temp: "--", hum: "--", wind: "--", cond: "Unknown" };
    document.getElementById("icon").textContent = data.icon;
    document.getElementById("temp").textContent = data.temp + "\u00B0F";
    document.getElementById("name").textContent = city;
    document.getElementById("hum").textContent = data.hum + "%";
    document.getElementById("wind").textContent = data.wind + " mph";
    document.getElementById("cond").textContent = data.cond;
  }
</script>
</body>
</html>`,
      "app/index.tsx": `import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import { SearchBar } from "../components/SearchBar";
import { WeatherCard } from "../components/WeatherCard";

interface Weather {
  city: string;
  temp: number;
  humidity: number;
  wind: number;
  condition: string;
  icon: string;
}

const MOCK: Record<string, Weather> = {
  "San Francisco": { city: "San Francisco", temp: 72, humidity: 65, wind: 12, condition: "Sunny", icon: "\u2600\uFE0F" },
  "New York": { city: "New York", temp: 58, humidity: 78, wind: 18, condition: "Cloudy", icon: "\u26C5" },
  "London": { city: "London", temp: 50, humidity: 85, wind: 15, condition: "Rainy", icon: "\uD83C\uDF27\uFE0F" },
  "Tokyo": { city: "Tokyo", temp: 68, humidity: 55, wind: 8, condition: "Clear", icon: "\uD83C\uDF24\uFE0F" },
};

export default function WeatherScreen() {
  const [weather, setWeather] = useState<Weather>(MOCK["San Francisco"]!);

  const handleSearch = (city: string) => {
    const data = MOCK[city];
    if (data) setWeather(data);
  };

  return (
    <View style={styles.container}>
      <SearchBar onSearch={handleSearch} />
      <WeatherCard weather={weather} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#667eea" },
});`,
      "components/SearchBar.tsx": `import React, { useState } from "react";
import { View, TextInput, TouchableOpacity, Text, StyleSheet } from "react-native";

interface Props {
  onSearch: (city: string) => void;
}

export function SearchBar({ onSearch }: Props) {
  const [text, setText] = useState("");

  const handleSearch = () => {
    if (text.trim()) {
      onSearch(text.trim());
      setText("");
    }
  };

  return (
    <View style={styles.row}>
      <TextInput
        style={styles.input}
        value={text}
        onChangeText={setText}
        placeholder="Search city..."
        placeholderTextColor="#aaa"
        onSubmitEditing={handleSearch}
      />
      <TouchableOpacity style={styles.button} onPress={handleSearch}>
        <Text style={styles.buttonText}>Go</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 8, marginBottom: 24 },
  input: { flex: 1, padding: 12, backgroundColor: "rgba(255,255,255,0.9)", borderRadius: 8, fontSize: 16 },
  button: { paddingHorizontal: 16, backgroundColor: "rgba(255,255,255,0.3)", borderRadius: 8, justifyContent: "center" },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
});`,
      "components/WeatherCard.tsx": `import React from "react";
import { View, Text, StyleSheet } from "react-native";

interface Props {
  weather: {
    city: string;
    temp: number;
    humidity: number;
    wind: number;
    condition: string;
    icon: string;
  };
}

export function WeatherCard({ weather }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.icon}>{weather.icon}</Text>
      <Text style={styles.temp}>{weather.temp}\u00B0F</Text>
      <Text style={styles.city}>{weather.city}</Text>
      <View style={styles.details}>
        <View style={styles.detailItem}>
          <Text style={styles.label}>Humidity</Text>
          <Text style={styles.value}>{weather.humidity}%</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.label}>Wind</Text>
          <Text style={styles.value}>{weather.wind} mph</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.label}>Condition</Text>
          <Text style={styles.value}>{weather.condition}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: "rgba(255,255,255,0.95)", borderRadius: 16, padding: 32, alignItems: "center" },
  icon: { fontSize: 64, marginBottom: 8 },
  temp: { fontSize: 48, fontWeight: "bold", color: "#333" },
  city: { fontSize: 20, color: "#666", marginTop: 4 },
  details: { flexDirection: "row", justifyContent: "space-around", width: "100%", marginTop: 24, paddingTop: 16, borderTopWidth: 1, borderTopColor: "#eee" },
  detailItem: { alignItems: "center" },
  label: { fontSize: 12, color: "#999" },
  value: { fontSize: 16, fontWeight: "600", color: "#333" },
});`,
    },
  },
  {
    id: "chat",
    name: "Chat App",
    description: "Real-time chat interface",
    icon: "\uD83D\uDCAC",
    files: {
      "preview.html": `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Chat App</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, sans-serif; background: #f0f0f0; height: 100vh; display: flex; flex-direction: column; }
  .header { background: #007AFF; color: white; padding: 16px; text-align: center; font-size: 18px; font-weight: 600; }
  .messages { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 8px; }
  .msg { max-width: 75%; padding: 10px 14px; border-radius: 16px; font-size: 15px; line-height: 1.4; }
  .msg.sent { align-self: flex-end; background: #007AFF; color: white; border-bottom-right-radius: 4px; }
  .msg.received { align-self: flex-start; background: white; color: #333; border-bottom-left-radius: 4px; }
  .input-row { display: flex; gap: 8px; padding: 12px; background: white; border-top: 1px solid #ddd; }
  .input-row input { flex: 1; padding: 10px; border: 1px solid #ddd; border-radius: 20px; font-size: 16px; }
  .input-row button { width: 40px; height: 40px; background: #007AFF; color: white; border: none; border-radius: 50%; cursor: pointer; font-size: 18px; }
</style>
</head>
<body>
<div class="header">Chat</div>
<div class="messages" id="msgs">
  <div class="msg received">Hey! How are you?</div>
  <div class="msg sent">I'm great, thanks! Working on a new project.</div>
  <div class="msg received">That sounds awesome! Tell me more.</div>
</div>
<div class="input-row">
  <input id="inp" placeholder="Type a message..." />
  <button onclick="send()">\u2191</button>
</div>
<script>
  function send() {
    const inp = document.getElementById("inp");
    const text = inp.value.trim();
    if (!text) return;
    const msgs = document.getElementById("msgs");
    const div = document.createElement("div");
    div.className = "msg sent";
    div.textContent = text;
    msgs.appendChild(div);
    inp.value = "";
    msgs.scrollTop = msgs.scrollHeight;
    setTimeout(() => {
      const reply = document.createElement("div");
      reply.className = "msg received";
      reply.textContent = "That's interesting!";
      msgs.appendChild(reply);
      msgs.scrollTop = msgs.scrollHeight;
    }, 1000);
  }
  document.getElementById("inp").addEventListener("keydown", e => { if (e.key === "Enter") send(); });
</script>
</body>
</html>`,
      "app/index.tsx": `import React, { useState, useRef } from "react";
import { View, FlatList, StyleSheet } from "react-native";
import { MessageBubble } from "../components/MessageBubble";
import { ChatInput } from "../components/ChatInput";

interface Message {
  id: string;
  text: string;
  sent: boolean;
}

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([
    { id: "1", text: "Hey! How are you?", sent: false },
    { id: "2", text: "I'm great, thanks! Working on a new project.", sent: true },
    { id: "3", text: "That sounds awesome! Tell me more.", sent: false },
  ]);
  const flatListRef = useRef<FlatList>(null);

  const handleSend = (text: string) => {
    const newMsg: Message = { id: Date.now().toString(), text, sent: true };
    setMessages((prev) => [...prev, newMsg]);

    setTimeout(() => {
      const reply: Message = {
        id: (Date.now() + 1).toString(),
        text: "That's interesting!",
        sent: false,
      };
      setMessages((prev) => [...prev, reply]);
    }, 1000);
  };

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <MessageBubble message={item} />}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        contentContainerStyle={styles.list}
      />
      <ChatInput onSend={handleSend} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f0f0f0" },
  list: { padding: 16, gap: 8 },
});`,
      "components/MessageBubble.tsx": `import React from "react";
import { View, Text, StyleSheet } from "react-native";

interface Props {
  message: { text: string; sent: boolean };
}

export function MessageBubble({ message }: Props) {
  return (
    <View style={[styles.bubble, message.sent ? styles.sent : styles.received]}>
      <Text style={[styles.text, message.sent && styles.sentText]}>
        {message.text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: { maxWidth: "75%", padding: 10, paddingHorizontal: 14, borderRadius: 16 },
  sent: { alignSelf: "flex-end", backgroundColor: "#007AFF", borderBottomRightRadius: 4 },
  received: { alignSelf: "flex-start", backgroundColor: "#fff", borderBottomLeftRadius: 4 },
  text: { fontSize: 15, lineHeight: 20, color: "#333" },
  sentText: { color: "#fff" },
});`,
      "components/ChatInput.tsx": `import React, { useState } from "react";
import { View, TextInput, TouchableOpacity, Text, StyleSheet } from "react-native";

interface Props {
  onSend: (text: string) => void;
}

export function ChatInput({ onSend }: Props) {
  const [text, setText] = useState("");

  const handleSend = () => {
    if (text.trim()) {
      onSend(text.trim());
      setText("");
    }
  };

  return (
    <View style={styles.row}>
      <TextInput
        style={styles.input}
        value={text}
        onChangeText={setText}
        placeholder="Type a message..."
        onSubmitEditing={handleSend}
      />
      <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
        <Text style={styles.sendText}>\u2191</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 8, padding: 12, backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#ddd" },
  input: { flex: 1, padding: 10, borderWidth: 1, borderColor: "#ddd", borderRadius: 20, fontSize: 16 },
  sendBtn: { width: 40, height: 40, backgroundColor: "#007AFF", borderRadius: 20, alignItems: "center", justifyContent: "center" },
  sendText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
});`,
    },
  },
  {
    id: "ecommerce",
    name: "E-Commerce",
    description: "Product listing with cart",
    icon: "\uD83D\uDED2",
    files: {
      "preview.html": `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>E-Commerce</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, sans-serif; background: #f8f8f8; padding: 20px; }
  h1 { text-align: center; margin-bottom: 8px; }
  .cart-badge { text-align: center; margin-bottom: 16px; color: #007AFF; font-weight: 600; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; max-width: 420px; margin: 0 auto; }
  .product { background: white; border-radius: 12px; padding: 16px; text-align: center; }
  .product .emoji { font-size: 48px; margin-bottom: 8px; }
  .product .name { font-weight: 600; margin-bottom: 4px; }
  .product .price { color: #007AFF; font-weight: 700; margin-bottom: 8px; }
  .product button { padding: 8px 16px; background: #007AFF; color: white; border: none; border-radius: 8px; cursor: pointer; }
</style>
</head>
<body>
<h1>Shop</h1>
<div class="cart-badge" id="badge">Cart: 0 items</div>
<div class="grid" id="grid"></div>
<script>
  const products = [
    { name: "Headphones", price: 99, emoji: "\uD83C\uDFA7" },
    { name: "Watch", price: 249, emoji: "\u231A" },
    { name: "Camera", price: 599, emoji: "\uD83D\uDCF7" },
    { name: "Keyboard", price: 149, emoji: "\u2328\uFE0F" },
  ];
  let cart = 0;
  const grid = document.getElementById("grid");
  grid.innerHTML = products.map((p, i) =>
    \`<div class="product">
      <div class="emoji">\${p.emoji}</div>
      <div class="name">\${p.name}</div>
      <div class="price">$\${p.price}</div>
      <button onclick="addToCart(\${i})">Add to Cart</button>
    </div>\`
  ).join("");
  function addToCart() {
    cart++;
    document.getElementById("badge").textContent = "Cart: " + cart + " items";
  }
</script>
</body>
</html>`,
      "app/index.tsx": `import React, { useState } from "react";
import { View, FlatList, Text, StyleSheet } from "react-native";
import { ProductCard } from "../components/ProductCard";

interface Product {
  id: string;
  name: string;
  price: number;
  emoji: string;
}

const PRODUCTS: Product[] = [
  { id: "1", name: "Headphones", price: 99, emoji: "\uD83C\uDFA7" },
  { id: "2", name: "Watch", price: 249, emoji: "\u231A" },
  { id: "3", name: "Camera", price: 599, emoji: "\uD83D\uDCF7" },
  { id: "4", name: "Keyboard", price: 149, emoji: "\u2328\uFE0F" },
];

export default function ShopScreen() {
  const [cartCount, setCartCount] = useState(0);

  const addToCart = () => {
    setCartCount((prev) => prev + 1);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Shop</Text>
      <Text style={styles.badge}>Cart: {cartCount} items</Text>
      <FlatList
        data={PRODUCTS}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        renderItem={({ item }) => (
          <ProductCard product={item} onAddToCart={addToCart} />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#f8f8f8" },
  title: { fontSize: 28, fontWeight: "bold", textAlign: "center", marginBottom: 4 },
  badge: { textAlign: "center", color: "#007AFF", fontWeight: "600", marginBottom: 16 },
  row: { gap: 12 },
});`,
      "components/ProductCard.tsx": `import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

interface Props {
  product: { name: string; price: number; emoji: string };
  onAddToCart: () => void;
}

export function ProductCard({ product, onAddToCart }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.emoji}>{product.emoji}</Text>
      <Text style={styles.name}>{product.name}</Text>
      <Text style={styles.price}>\${product.price}</Text>
      <TouchableOpacity style={styles.button} onPress={onAddToCart}>
        <Text style={styles.buttonText}>Add to Cart</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, backgroundColor: "#fff", borderRadius: 12, padding: 16, alignItems: "center" },
  emoji: { fontSize: 48, marginBottom: 8 },
  name: { fontWeight: "600", marginBottom: 4 },
  price: { color: "#007AFF", fontWeight: "700", marginBottom: 8 },
  button: { paddingVertical: 8, paddingHorizontal: 16, backgroundColor: "#007AFF", borderRadius: 8 },
  buttonText: { color: "#fff", fontWeight: "600" },
});`,
    },
  },
  {
    id: "fitness",
    name: "Fitness Tracker",
    description: "Workout logging and tracking",
    icon: "\uD83C\uDFCB\uFE0F",
    files: {
      "preview.html": `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Fitness Tracker</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, sans-serif; background: #1a1a2e; color: white; padding: 20px; min-height: 100vh; }
  .container { max-width: 400px; margin: 0 auto; }
  h1 { text-align: center; margin-bottom: 20px; }
  .stats { display: flex; gap: 12px; margin-bottom: 24px; }
  .stat { flex: 1; background: #16213e; border-radius: 12px; padding: 16px; text-align: center; }
  .stat-value { font-size: 24px; font-weight: bold; color: #00d4ff; }
  .stat-label { font-size: 12px; color: #888; margin-top: 4px; }
  .form { background: #16213e; border-radius: 12px; padding: 16px; margin-bottom: 16px; }
  .form select, .form input { width: 100%; padding: 10px; margin-bottom: 8px; border: 1px solid #333; border-radius: 8px; background: #0f3460; color: white; font-size: 14px; }
  .form button { width: 100%; padding: 10px; background: #00d4ff; color: #1a1a2e; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; }
  .log { background: #16213e; border-radius: 12px; padding: 12px; margin-bottom: 8px; display: flex; justify-content: space-between; }
  .log-name { font-weight: 600; }
  .log-detail { color: #00d4ff; }
</style>
</head>
<body>
<div class="container">
  <h1>\uD83C\uDFCB\uFE0F Fitness Tracker</h1>
  <div class="stats">
    <div class="stat"><div class="stat-value" id="total">0</div><div class="stat-label">Workouts</div></div>
    <div class="stat"><div class="stat-value" id="mins">0</div><div class="stat-label">Minutes</div></div>
    <div class="stat"><div class="stat-value" id="cals">0</div><div class="stat-label">Calories</div></div>
  </div>
  <div class="form">
    <select id="type"><option>Running</option><option>Weight Training</option><option>Yoga</option><option>Cycling</option></select>
    <input id="duration" type="number" placeholder="Duration (min)" />
    <button onclick="addWorkout()">Log Workout</button>
  </div>
  <div id="logs"></div>
</div>
<script>
  let workouts = [];
  function addWorkout() {
    const type = document.getElementById("type").value;
    const dur = parseInt(document.getElementById("duration").value) || 0;
    if (!dur) return;
    const cals = Math.round(dur * (type === "Running" ? 10 : type === "Cycling" ? 8 : type === "Weight Training" ? 6 : 4));
    workouts.unshift({ type, duration: dur, calories: cals });
    document.getElementById("duration").value = "";
    render();
  }
  function render() {
    document.getElementById("total").textContent = workouts.length;
    document.getElementById("mins").textContent = workouts.reduce((s, w) => s + w.duration, 0);
    document.getElementById("cals").textContent = workouts.reduce((s, w) => s + w.calories, 0);
    document.getElementById("logs").innerHTML = workouts.map(w =>
      \`<div class="log"><span class="log-name">\${w.type}</span><span class="log-detail">\${w.duration} min \u2022 \${w.calories} cal</span></div>\`
    ).join("");
  }
  render();
</script>
</body>
</html>`,
      "app/index.tsx": `import React, { useState } from "react";
import { View, FlatList, Text, StyleSheet } from "react-native";
import { StatsBar } from "../components/StatsBar";
import { WorkoutForm } from "../components/WorkoutForm";

interface Workout {
  id: string;
  type: string;
  duration: number;
  calories: number;
}

const CALORIE_RATES: Record<string, number> = {
  Running: 10,
  "Weight Training": 6,
  Yoga: 4,
  Cycling: 8,
};

export default function FitnessScreen() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);

  const addWorkout = (type: string, duration: number) => {
    const calories = Math.round(duration * (CALORIE_RATES[type] || 5));
    setWorkouts((prev) => [
      { id: Date.now().toString(), type, duration, calories },
      ...prev,
    ]);
  };

  const totalMins = workouts.reduce((s, w) => s + w.duration, 0);
  const totalCals = workouts.reduce((s, w) => s + w.calories, 0);

  return (
    <View style={styles.container}>
      <StatsBar count={workouts.length} minutes={totalMins} calories={totalCals} />
      <WorkoutForm onAdd={addWorkout} />
      <FlatList
        data={workouts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.log}>
            <Text style={styles.logName}>{item.type}</Text>
            <Text style={styles.logDetail}>{item.duration} min \u2022 {item.calories} cal</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#1a1a2e" },
  log: { backgroundColor: "#16213e", borderRadius: 12, padding: 12, marginBottom: 8, flexDirection: "row" as const, justifyContent: "space-between" as const },
  logName: { color: "#fff", fontWeight: "600" as const },
  logDetail: { color: "#00d4ff" },
});`,
      "components/StatsBar.tsx": `import React from "react";
import { View, Text, StyleSheet } from "react-native";

interface Props {
  count: number;
  minutes: number;
  calories: number;
}

export function StatsBar({ count, minutes, calories }: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.stat}>
        <Text style={styles.value}>{count}</Text>
        <Text style={styles.label}>Workouts</Text>
      </View>
      <View style={styles.stat}>
        <Text style={styles.value}>{minutes}</Text>
        <Text style={styles.label}>Minutes</Text>
      </View>
      <View style={styles.stat}>
        <Text style={styles.value}>{calories}</Text>
        <Text style={styles.label}>Calories</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 12, marginBottom: 24 },
  stat: { flex: 1, backgroundColor: "#16213e", borderRadius: 12, padding: 16, alignItems: "center" },
  value: { fontSize: 24, fontWeight: "bold", color: "#00d4ff" },
  label: { fontSize: 12, color: "#888", marginTop: 4 },
});`,
      "components/WorkoutForm.tsx": `import React, { useState } from "react";
import { View, TextInput, TouchableOpacity, Text, StyleSheet } from "react-native";

const TYPES = ["Running", "Weight Training", "Yoga", "Cycling"];

interface Props {
  onAdd: (type: string, duration: number) => void;
}

export function WorkoutForm({ onAdd }: Props) {
  const [selectedType, setSelectedType] = useState(TYPES[0]!);
  const [duration, setDuration] = useState("");

  const handleAdd = () => {
    const dur = parseInt(duration, 10);
    if (dur > 0) {
      onAdd(selectedType, dur);
      setDuration("");
    }
  };

  return (
    <View style={styles.form}>
      <View style={styles.types}>
        {TYPES.map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.typeBtn, selectedType === t && styles.typeBtnActive]}
            onPress={() => setSelectedType(t)}
          >
            <Text style={[styles.typeText, selectedType === t && styles.typeTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TextInput
        style={styles.input}
        value={duration}
        onChangeText={setDuration}
        placeholder="Duration (min)"
        placeholderTextColor="#666"
        keyboardType="numeric"
      />
      <TouchableOpacity style={styles.button} onPress={handleAdd}>
        <Text style={styles.buttonText}>Log Workout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  form: { backgroundColor: "#16213e", borderRadius: 12, padding: 16, marginBottom: 16 },
  types: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 },
  typeBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: "#333" },
  typeBtnActive: { backgroundColor: "#00d4ff", borderColor: "#00d4ff" },
  typeText: { color: "#888", fontSize: 13 },
  typeTextActive: { color: "#1a1a2e", fontWeight: "600" },
  input: { padding: 10, borderWidth: 1, borderColor: "#333", borderRadius: 8, backgroundColor: "#0f3460", color: "#fff", marginBottom: 8 },
  button: { padding: 10, backgroundColor: "#00d4ff", borderRadius: 8, alignItems: "center" },
  buttonText: { color: "#1a1a2e", fontWeight: "600" },
});`,
    },
  },
  {
    id: "blank",
    name: "Blank Project",
    description: "Empty starter project",
    icon: "\uD83D\uDCC4",
    files: {
      "preview.html": `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Blank Project</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, sans-serif; background: #fff; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
  .center { text-align: center; color: #333; }
  .center h1 { font-size: 24px; margin-bottom: 8px; }
  .center p { color: #666; }
</style>
</head>
<body>
<div class="center">
  <h1>Hello World</h1>
  <p>Start building your app!</p>
</div>
</body>
</html>`,
      "app/index.tsx": `import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hello World</Text>
      <Text style={styles.subtitle}>Start building your app!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#fff" },
  title: { fontSize: 24, fontWeight: "bold", color: "#333", marginBottom: 8 },
  subtitle: { fontSize: 16, color: "#666" },
});`,
    },
  },
];

export function getTemplate(id: string): Template | undefined {
  return TEMPLATES.find((t) => t.id === id);
}
