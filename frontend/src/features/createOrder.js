import api from "../../utils/axios";

export const createOrder = async (plan, userId) => {
  try {
    const { data } = await api.post("/api/billing/create", { plan });
    console.log(data);
    return data;
  } catch (error) {
    console.error("Create order error:", error);
    throw error;
  }
};