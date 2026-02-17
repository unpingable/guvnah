<!-- SPDX-License-Identifier: Apache-2.0 -->
<script lang="ts">
  import { verdictClass } from '$lib/format';

  let { verdict }: { verdict: string } = $props();
</script>

<span class="pill {verdictClass(verdict)}">{verdict}</span>
