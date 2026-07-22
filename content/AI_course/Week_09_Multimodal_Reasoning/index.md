---
source: manual
title: "Week 9 — Multimodal & Reasoning"
slug: "Week_09_Multimodal_Reasoning"
parent: "AI_course"
children: []
order: 9
icon: "👁️"
cover: null
---
# Week 9 — Image and Reasoning Models

**Goal by end of week:** you understand how models connect text and images (CLIP, ViT), the basic mechanism behind image-generating diffusion models, and how chain-of-thought/RLHF shape reasoning behavior in modern models.

**From last week:** everything so far has been text-in, text-out. This week extends the same core ideas (embeddings, attention, training objectives) to images and to explicit reasoning behavior.

---

## Day 1 — Multimodal Models Overview

- **The core challenge:** text and images are fundamentally different data types (a sequence of discrete tokens vs. a grid of continuous pixel values) — multimodal models need a way to represent both in a *shared* space so the model can reason across them.
- **The general recipe:** convert images into a sequence of "tokens" too (via patching, Day 3), then feed text tokens and image tokens through a shared or connected Transformer architecture, trained so the model learns associations between the two modalities.
- **Two main flavors of multimodal systems:** understanding models (input image + text, output text — e.g. "describe this image," "answer this question about this chart") and generation models (input text, output an image — the diffusion models in Day 4).
- **Why this matters for products, not just research:** multimodal RAG (retrieving relevant images alongside text), document/receipt/chart understanding, and visual agents (an agent that can see a screenshot and decide what to click) are all now common production patterns built on these foundations.
- **Self-check:** why can't you just feed raw pixel values directly into a text Transformer the way you feed token embeddings?

---

## Day 2 — CLIP (Contrastive Language-Image Pretraining)

- **The core idea:** train two encoders simultaneously — one for images, one for text — such that the embedding of an image and the embedding of its correct caption end up close together in a shared vector space, while embeddings of *mismatched* image-caption pairs end up far apart.
- **Contrastive training, concretely:** given a batch of (image, caption) pairs, the model is trained so each image's embedding is most similar to its *own* caption's embedding, out of all captions in the batch — this contrastive objective, not any explicit labels, is what teaches the shared space.
- **Why this enables zero-shot classification:** once trained, you can classify a new image into *any* set of categories you define at inference time, just by comparing the image embedding to text embeddings of category names like "a photo of a dog" — no task-specific training needed, a direct payoff of the shared embedding space.
- **What CLIP is good and bad at:** excellent at general visual-semantic matching (search, zero-shot classification, retrieval); weaker at precise counting, fine-grained spatial reasoning, and reading dense text within images (later multimodal models improve on these, but it's a useful mental model of CLIP's actual limits).
- **Self-check:** why does training on (image, caption) pairs scraped from the internet, with no manual labeling, still produce a model useful for classification tasks it was never explicitly trained on?

**Paper:** [Learning Transferable Visual Models From Natural Language Supervision](https://arxiv.org/abs/2103.00020) — Radford et al., 2021
**Blog:** [OpenAI — CLIP blog post](https://openai.com/index/clip/)

---

## Day 3 — Vision Transformers (ViT)

- **The core trick:** split an image into fixed-size patches (e.g. 16x16 pixels each), flatten and linearly project each patch into a vector — now you have a sequence of "patch tokens," and the exact same Transformer architecture from Week 1 (self-attention and all) can process an image just like it processes a sentence.
- **Why this was surprising at the time:** convolutional neural networks (CNNs), which build in an assumption that nearby pixels matter more (a strong "inductive bias"), had dominated vision for years; ViT has no such built-in assumption — it has to *learn* spatial relationships purely from attention and data, which requires more training data but scales very well once you have it.
- **Position embeddings for images:** since attention itself has no inherent sense of order/position (recall Week 1's causal masking discussion for text), ViT adds position embeddings to patch tokens so the model knows which patch was where in the original image.
- **Why this matters for the rest of the week:** ViT-style patch embeddings are the standard way images get "tokenized" for use inside larger multimodal Transformers (including the vision encoders inside modern multimodal LLMs).
- **Self-check:** why does a Vision Transformer typically need more training data than a comparable CNN to reach the same accuracy, given it has no built-in assumption about nearby pixels being related?

**Paper:** [An Image is Worth 16x16 Words: Transformers for Image Recognition at Scale](https://arxiv.org/abs/2010.11929) — Dosovitskiy et al., 2020

---

## Day 4 — Diffusion Models

- **The core mechanism:** train a model to reverse a gradual noising process. Start with a real image, add a little Gaussian noise, repeat many times until it's pure noise; train a neural network to predict and remove a small amount of noise at each step. At generation time, start from pure random noise and run the learned denoising process backward, step by step, until a coherent image emerges.
- **Why this works (the intuition, not the full math):** predicting "what noise was just added" at any given noise level is a tractable learning problem; chaining many small, accurate denoising steps together turns out to be capable of generating highly detailed, coherent images from nothing but noise + a lot of small corrective steps.
- **Conditioning on text:** to get "a photo of an astronaut riding a horse" rather than a random image, the denoising network is also given a text embedding (often from a CLIP-like text encoder) at every step, steering each denoising step toward images consistent with that description.
- **Latent diffusion (Stable Diffusion's key efficiency trick):** instead of running the noising/denoising process on full-resolution pixels (expensive), first compress the image into a smaller "latent" representation (via a separate autoencoder), run diffusion in that compact latent space, then decode back to pixels at the end — much cheaper to train and run.
- **Self-check:** why is it easier to train a model to predict "how much noise was just added" than to train a model to directly generate a full realistic image from nothing in one shot?

**Papers:** [Denoising Diffusion Probabilistic Models](https://arxiv.org/abs/2006.11239) — Ho et al., 2020 · [High-Resolution Image Synthesis with Latent Diffusion Models](https://arxiv.org/abs/2112.10752) — Rombach et al., 2022
**Blog:** [Lilian Weng — What are Diffusion Models?](https://lilianweng.github.io/posts/2021-07-11-diffusion-models/) · [Jay Alammar — The Illustrated Stable Diffusion](https://jalammar.github.io/illustrated-stable-diffusion/)

---

## Day 5 — Video Models, Chain-of-Thought, and RLHF Revisited

- **Video models, the extra dimension:** the same diffusion/Transformer ideas extend to video by treating it as noise-and-denoise across both space *and* time — the added challenge is temporal consistency (objects shouldn't flicker or morph unnaturally between frames), which is why video generation lagged image generation in quality for a while.
- **Chain-of-Thought (CoT) prompting:** simply instructing (or training) a model to "think step by step" before giving a final answer measurably improves performance on reasoning tasks — writing out intermediate steps gives the model more computation (more forward passes worth of "thinking") and a chance to catch its own errors before committing to a final answer.
- **Why CoT works mechanically, not just anecdotally:** a model producing an answer in one shot has a fixed amount of computation (one forward pass) to get from question to answer; generating intermediate reasoning tokens first effectively lets the model "spend" more computation on harder problems, since each new token is another forward pass building on all previous tokens including its own reasoning so far.
- **RLHF, revisited with reasoning in mind:** Week 1 covered RLHF for general helpfulness/alignment; modern "reasoning models" extend this idea by training specifically to reward good *reasoning traces* (not just good final answers), and in some cases apply reinforcement learning directly on tasks with checkable answers (like math or code), reinforcing whichever reasoning paths actually reach correct outputs.
- **Self-check:** why would training a model to be rewarded only for *correct final answers*, ignoring the reasoning path, risk reinforcing reasoning that happens to reach the right answer for the wrong reasons?

**Papers:** [Chain-of-Thought Prompting Elicits Reasoning in Large Language Models](https://arxiv.org/abs/2201.11903) — Wei et al., 2022 · [Deep Reinforcement Learning from Human Preferences](https://arxiv.org/abs/1706.03741) — Christiano et al., 2017

---

## Day 6-7 — Projects

### 🟢 Easy — Zero-shot image classification with CLIP
Take 20 of your own photos across 5 categories you define, and use CLIP to zero-shot classify them (compare image embeddings against text embeddings of your category names). **Deliverable:** accuracy report + 2-3 misclassified examples with your guess at why CLIP got them wrong.

### 🟡 Medium — CLIP-based image search engine
Embed a folder of 100+ images with CLIP, store the embeddings in a vector DB (reuse your Week 3 stack), and build a text-query search ("show me pictures with a red car") returning the closest matching images. **Deliverable:** working search + 5 example queries with their top-3 returned images.

### 🔴 Hard — Multimodal RAG, or fine-tune a small diffusion model
Either (a) build a multimodal RAG system that retrieves *both* relevant text passages and relevant images for a query and uses both as context for the answer, or (b) fine-tune a small diffusion model (via LoRA/DreamBooth) on 10-20 custom images of a specific subject. **Deliverable (a):** a working demo + 3 queries showing both modalities being retrieved and used. **Deliverable (b):** 5 generated images of your subject in novel contexts/poses, plus 2 failure cases and your analysis of why.

---

## 📺 Videos & Courses

**YouTube**
- [Umar Jamil — Coding Stable Diffusion from scratch in PyTorch](https://www.youtube.com/watch?v=ZBKpAp_6TGI) — codes CLIP, the VAE, and the full latent diffusion pipeline live, directly matching Days 2 and 4, and a strong companion for the Day 6 Hard project's diffusion option.
- [StatQuest — Reinforcement Learning with Human Feedback (RLHF), Clearly Explained!!!](https://www.youtube.com/watch?v=qPN_XZcJf_s) — revisits Day 5's RLHF material at a slower, example-driven pace.

**Udemy**
- No single verified course maps cleanly to this week's CLIP/ViT/diffusion combination — search Udemy for **"Stable Diffusion from scratch"** or **"computer vision transformers"** and check recent reviews before enrolling.

---

## References
**Papers**
- [Learning Transferable Visual Models From Natural Language Supervision (CLIP)](https://arxiv.org/abs/2103.00020) — Radford et al., 2021
- [An Image is Worth 16x16 Words (ViT)](https://arxiv.org/abs/2010.11929) — Dosovitskiy et al., 2020
- [Denoising Diffusion Probabilistic Models](https://arxiv.org/abs/2006.11239) — Ho et al., 2020
- [High-Resolution Image Synthesis with Latent Diffusion Models](https://arxiv.org/abs/2112.10752) — Rombach et al., 2022
- [Chain-of-Thought Prompting Elicits Reasoning in Large Language Models](https://arxiv.org/abs/2201.11903) — Wei et al., 2022
- [Deep Reinforcement Learning from Human Preferences](https://arxiv.org/abs/1706.03741) — Christiano et al., 2017

**Blogs**
- Lilian Weng — [What are Diffusion Models?](https://lilianweng.github.io/posts/2021-07-11-diffusion-models/)
- Jay Alammar — [The Illustrated Stable Diffusion](https://jalammar.github.io/illustrated-stable-diffusion/)
- OpenAI — [CLIP blog post](https://openai.com/index/clip/)

