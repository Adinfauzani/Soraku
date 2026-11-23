import { Global, Module, OnModuleInit } from '@nestjs/common';
import { Registry } from './registry';
import { AniList } from './anilist';
import { Jikan } from './jikan';
import { HiAnime } from './hianime';
import { AnimePahe } from './animepahe';
import { AnimeKai } from './animekai';
import { KickAssAnime } from './kickassanime';
import { Otakudesu } from './otakudesu';
import { Wajik } from './wajik';
import { Kitsu } from './kitsu';
import { Oploverz } from './oploverz';
import { Miruro } from './miruro';

@Global()
@Module({
  providers: [Registry, AniList, Jikan, HiAnime, AnimePahe, AnimeKai, KickAssAnime, Otakudesu, Wajik, Kitsu, Oploverz, Miruro],
  exports: [Registry],
})
export class SourcesModule implements OnModuleInit {
  constructor(
    private readonly registry: Registry,
    private readonly anilist: AniList,
    private readonly jikan: Jikan,
    private readonly hianime: HiAnime,
    private readonly animepahe: AnimePahe,
    private readonly animekai: AnimeKai,
    private readonly kickass: KickAssAnime,
    private readonly otakudesu: Otakudesu,
    private readonly wajik: Wajik,
    private readonly kitsu: Kitsu,
    private readonly oploverz: Oploverz,
    private readonly miruro: Miruro,
  ) {}

  onModuleInit() {
    this.registry.register(this.anilist);
    this.registry.register(this.jikan);
    this.registry.register(this.otakudesu);
    this.registry.register(this.hianime);
    this.registry.register(this.animepahe);
    this.registry.register(this.animekai);
    this.registry.register(this.kickass);
    this.registry.register(this.wajik);
    this.registry.register(this.kitsu);
    this.registry.register(this.oploverz);
    this.registry.register(this.miruro);
  }
}
