<template>
  <main class="flex flex-col justify-center">
    <section class="mt-8 text-center">
      <h1 class="text-2xl font-bold">
        Twój Ulubiony Bot
      </h1>
      <p class="mt-4">
        Zaproś swojego ulubionego bota na Discorda i baw się dobrze!
      </p>
      <ul class="mt-4 list-disc list-inside">
        <li>/fakt - Walę faktami</li>
        <li>/żart lub /zart - Mówię super zabawne żarty</li>
        <li>/joke - Mówię bardziej zrozumiałe żarty po angielsku</li>
        <li>/defakto - Walę faktami po niemiecku</li>
        <li>/korwin - Podaję wymyślony cytat Pana Korwina (<a href="https://github.com/Encryptize/korwin.py" target="_blank" rel="noopener noreferrer" class="text-blue-500 underline">źródło</a>)</li>
      </ul>
      <a
        href="https://discord.com/oauth2/authorize?client_id=551897721405964329&permissions=60416&integration_type=0&scope=bot+applications.commands"
        class="mt-6 inline-block px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        target="_blank"
        rel="noopener noreferrer"
      >
        Dodaj Bota
      </a>
    </section>
  </main>
</template>
